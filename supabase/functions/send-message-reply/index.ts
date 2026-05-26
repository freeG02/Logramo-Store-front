// @ts-nocheck — Deno Edge Function (Supabase)
// Admin endpoint that posts a reply into a conversation thread.
//
//   POST /send-message-reply
//        body: { conversation_id, body }
//      → inserts a messages row with direction='out' (which fires the
//        bump_conversation_last_message trigger), sends an email to the
//        visitor with the reply text, and returns { ok }.
//
// ENV (auto-injected by Supabase):
//   RESEND_API_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const FROM = "Logramo <ayuda@logramo.com>";
const REPLY_TO = "ayuda@logramo.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });
}
function esc(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function nl2br(s: string): string { return esc(s).replace(/\n/g, "<br>"); }
function cap(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; }
function firstName(s?: string | null): string {
  if (!s || !s.trim()) return "";
  return cap(s.trim().split(/\s+/)[0].slice(0, 20));
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

function buildHtml(opts: { name: string; reply: string }): string {
  const greeting = opts.name ? `${esc(opts.name)},<br>` : "";
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><title>Te respondemos · Logramo</title></head>
<body style="margin:0;padding:0;background:#d6d4c8;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:600px;max-width:100%;background:#FEFAE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111A17;">
  <tr><td style="padding:32px 32px 0;">
    <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:42px;line-height:.95;letter-spacing:-.02em;text-transform:uppercase;color:#111A17;">${greeting}gracias por <span style="color:#C55932;font-style:italic;">escribirnos.</span></h1>
  </td></tr>
  <tr><td style="padding:24px 32px 8px;">
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.55;color:#3C4824;">Aquí va lo que queríamos contarte:</p>
  </td></tr>
  <tr><td style="padding:8px 32px 0;">
    <div style="background:#F8F3D9;border:1px solid #111A17;border-radius:14px;padding:22px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15.5px;line-height:1.6;color:#111A17;">${nl2br(opts.reply)}</div>
  </td></tr>
  <tr><td style="padding:28px 32px 32px;">
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#3C4824;">¿Otra duda? Vuelve al chat en <a href="https://logramo.com" style="color:#C55932;text-decoration:underline;">logramo.com</a> o responde a este email — leemos cada respuesta.</p>
  </td></tr>
  <tr><td style="background:#ADCBEF;padding:18px 32px;text-align:center;border-top:2px solid #111A17;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#3C4824;">
    © Logramo · Hecho para perros y los humanos que los adoran
  </td></tr>
</table>
</body></html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method === "GET" && new URL(req.url).searchParams.get("health") === "1") {
    return new Response("Logramo send-message-reply OK", { status: 200, headers: CORS });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });
  if (!SUPABASE_KEY)  return json({ ok: false, reason: "server_misconfigured" }, 500);
  if (!RESEND_API_KEY) return json({ ok: false, reason: "no_resend_key" }, 500);

  let body: any;
  try { body = await req.json(); }
  catch { return json({ ok: false, reason: "bad_json" }, 400); }

  const convId = String(body?.conversation_id ?? "").trim();
  const reply  = String(body?.body ?? body?.reply ?? "").trim();
  if (!convId) return json({ ok: false, reason: "missing_conversation_id" }, 400);
  if (reply.length < 2) return json({ ok: false, reason: "reply_too_short" }, 400);
  if (reply.length > 6000) return json({ ok: false, reason: "reply_too_long" }, 400);

  const convs = await sb("GET", `conversations?id=eq.${encodeURIComponent(convId)}&select=*`);
  const c = Array.isArray(convs.data) && convs.data[0];
  if (!c) return json({ ok: false, reason: "not_found" }, 404);

  // Insert the outbound message — triggers bump last_message_at
  const ins = await sb("POST", "messages", {
    conversation_id: convId,
    direction: "out",
    body: reply,
  });
  if (!ins.ok) return json({ ok: false, reason: "insert_failed", detail: ins.data }, 500);

  // Send the email to the visitor
  const subject = `Te respondemos · Logramo`;
  const html = buildHtml({ name: firstName(c.visitor_name), reply });
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [c.visitor_email], subject, html, reply_to: REPLY_TO }),
  });
  if (!r.ok) {
    const detail = await r.text();
    return json({ ok: false, reason: "resend_failed", detail }, 500);
  }
  return json({ ok: true });
});
