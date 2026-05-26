// @ts-nocheck — Deno Edge Function (Supabase)
// Visitor-facing endpoint that loads chat history for an email.
//
//   GET /chat-load?email=...
//      → returns { ok, conversations: [{...conv, messages: [...]}], idle_ms }
//        Most recent first, limited to the last 5 conversations. Each one
//        is flagged with `is_open` (true when last_message_at is within
//        the idle window AND closed_at IS NULL).
//
// Service-role only — RLS denies anon direct access.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const IDLE_MS = 60 * 60 * 1000;
const MAX_CONVS = 5;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json", ...CORS } });
}
async function sb(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) return [];
  return await r.json();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "GET")     return new Response("Method not allowed", { status: 405, headers: CORS });
  if (!SUPABASE_KEY)            return json({ ok: false, reason: "server_misconfigured" }, 500);

  const url = new URL(req.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, reason: "bad_email" }, 400);
  }

  const convs = await sb(
    `conversations?visitor_email=eq.${encodeURIComponent(email)}` +
    `&order=last_message_at.desc&limit=${MAX_CONVS}`
  );
  if (!convs.length) return json({ ok: true, conversations: [], idle_ms: IDLE_MS });

  const ids = convs.map((c: any) => c.id);
  const idList = ids.map((id: string) => `"${id}"`).join(",");
  const msgs = await sb(
    `messages?conversation_id=in.(${idList})&select=id,conversation_id,direction,body,created_at&order=created_at.asc`
  );
  const byConv: Record<string, any[]> = {};
  msgs.forEach((m: any) => {
    if (!byConv[m.conversation_id]) byConv[m.conversation_id] = [];
    byConv[m.conversation_id].push(m);
  });

  const now = Date.now();
  const enriched = convs.map((c: any) => {
    const last = new Date(c.last_message_at).getTime();
    const isOpen = !c.closed_at && (now - last) < IDLE_MS;
    return Object.assign({}, c, {
      is_open: isOpen,
      messages: byConv[c.id] || [],
    });
  });

  return json({ ok: true, conversations: enriched, idle_ms: IDLE_MS });
});
