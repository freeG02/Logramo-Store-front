// @ts-nocheck — Deno Edge Function (Supabase)
// Visitor-facing endpoint that writes a new chat message.
//
//   POST /chat-send
//        body: { email, name, body }
//      → finds an open conversation for that email (last_message_at within
//        the IDLE window AND closed_at IS NULL), or creates a new one.
//        Inserts a new message with direction='in'.
//        Returns { ok, conversation, messages } so the caller can immediately
//        render the updated thread without an extra round-trip.
//
// Uses the service role under the hood so the public anon key has no direct
// access to the conversations / messages tables (RLS denies everything).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const IDLE_MS = 60 * 60 * 1000; // 1 hour
const NAME_MAX = 60;
const EMAIL_MAX = 120;
const BODY_MIN = 2;
const BODY_MAX = 1500;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });
}

async function sb(method: string, path: string, body?: any, prefer = "return=representation") {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

function emailValid(s: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: CORS });

  if (!SUPABASE_KEY) return json({ ok: false, reason: "server_misconfigured" }, 500);

  let payload: any;
  try { payload = await req.json(); }
  catch { return json({ ok: false, reason: "bad_json" }, 400); }

  const name  = String(payload?.name  ?? "").trim().slice(0, NAME_MAX);
  const email = String(payload?.email ?? "").trim().toLowerCase().slice(0, EMAIL_MAX);
  const body  = String(payload?.body  ?? "").trim();
  const source = String(payload?.source ?? "chat").slice(0, 120);

  if (!name)               return json({ ok: false, reason: "missing_name" }, 400);
  if (!emailValid(email))  return json({ ok: false, reason: "bad_email" }, 400);
  if (body.length < BODY_MIN) return json({ ok: false, reason: "body_too_short" }, 400);
  if (body.length > BODY_MAX) return json({ ok: false, reason: "body_too_long" }, 400);

  const cutoff = new Date(Date.now() - IDLE_MS).toISOString();
  // Look for the latest still-open conversation for this email
  const lookup = await sb("GET",
    `conversations?visitor_email=eq.${encodeURIComponent(email)}` +
    `&closed_at=is.null&last_message_at=gte.${encodeURIComponent(cutoff)}` +
    `&order=last_message_at.desc&limit=1`);
  let conv = Array.isArray(lookup.data) && lookup.data.length ? lookup.data[0] : null;

  if (!conv) {
    const created = await sb("POST", "conversations", {
      visitor_email: email,
      visitor_name: name,
      source,
    });
    if (!created.ok || !Array.isArray(created.data) || !created.data.length) {
      return json({ ok: false, reason: "create_failed", detail: created.data }, 500);
    }
    conv = created.data[0];
  } else if (name && conv.visitor_name !== name) {
    // Keep the latest name they used
    await sb("PATCH", `conversations?id=eq.${conv.id}`, { visitor_name: name }, "return=minimal");
    conv.visitor_name = name;
  }

  const inserted = await sb("POST", "messages", {
    conversation_id: conv.id,
    direction: "in",
    body,
  });
  if (!inserted.ok) return json({ ok: false, reason: "insert_failed", detail: inserted.data }, 500);

  // Return the full thread so the client can re-render without another fetch
  const msgs = await sb("GET",
    `messages?conversation_id=eq.${conv.id}&select=id,direction,body,created_at&order=created_at.asc`);
  return json({ ok: true, conversation: conv, messages: msgs.data || [] });
});
