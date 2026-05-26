// @ts-nocheck — Deno Edge Function (Supabase)
// Sends Fritz an email notification whenever a new row lands in public.messages.
// Trigger: Supabase Database Webhook on INSERT.
// reply_to is set to the visitor's email so hitting "Reply" in any mail client
// answers them directly.
//
// ENV required:
//   RESEND_API_KEY
//   NOTIFY_TO  (optional) — defaults to ayuda@logramo.com

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "ayuda@logramo.com";
const FROM = "Logramo Chat <ayuda@logramo.com>";
const SITE_URL = "https://logramo.com";

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function nl2br(s: string): string { return esc(s).replace(/\n/g, "<br>"); }
function spDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function buildHtml(opts: { name: string; email: string; body: string; source: string; when: string }): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><title>Nuevo mensaje · Logramo</title></head>
<body style="margin:0;padding:0;background:#d6d4c8;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:600px;max-width:100%;background:#FEFAE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111A17;">
  <tr><td style="padding:24px 32px 18px;border-bottom:1px solid rgba(17,26,23,.12);">
    <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C55932;">Nuevo mensaje · ${esc(opts.when)}</div>
  </td></tr>
  <tr><td style="padding:32px 32px 12px;">
    <h1 style="margin:0 0 12px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:38px;line-height:1;letter-spacing:-.02em;text-transform:uppercase;color:#111A17;">${esc(opts.name)} <span style="color:#C55932;font-style:italic;">escribió.</span></h1>
    <p style="margin:6px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#3C4824;">${esc(opts.email)} · ${esc(opts.source)}</p>
  </td></tr>
  <tr><td style="padding:8px 32px 28px;">
    <div style="background:#F8F3D9;border:1px solid #111A17;border-radius:14px;padding:20px 22px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.55;color:#111A17;">${nl2br(opts.body)}</div>
  </td></tr>
  <tr><td style="padding:0 32px 28px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:#F6D055;border:2px solid #111A17;border-radius:12px;box-shadow:4px 4px 0 #111A17;">
          <a href="${SITE_URL}/admin.html#mensajes" style="display:inline-block;padding:12px 22px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#111A17;text-decoration:none;">Responder en el dashboard &nbsp;→</a>
        </td>
      </tr>
    </table>
    <p style="margin:14px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#5A6857;">O simplemente responde a este email — irá directo a ${esc(opts.email)}.</p>
  </td></tr>
  <tr><td style="background:#ADCBEF;padding:18px 32px;text-align:center;border-top:2px solid #111A17;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#3C4824;">
    © Logramo · Notificación automática del chat
  </td></tr>
</table>
</body></html>`;
}

serve(async (req: Request) => {
  if (req.method === "GET") return new Response("Logramo send-message-notify OK", { status: 200 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });
  }

  let payload: any;
  try { payload = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid JSON" }), { status: 400 }); }

  // Supabase Database Webhook shape: { type, table, schema, record, old_record }
  const r = payload?.record ?? payload ?? {};
  const name: string = (r.name ?? "").toString().trim() || "Visitante";
  const email: string = (r.email ?? "").toString().trim();
  const body: string = (r.body ?? "").toString();
  const source: string = (r.source ?? "chat").toString();
  const when = spDate(r.created_at);

  if (!email || !body) {
    return new Response(JSON.stringify({ error: "missing email or body" }), { status: 400 });
  }

  const html = buildHtml({ name, email, body, source, when });
  const subject = `Nuevo mensaje de ${name}`;

  const r2 = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [NOTIFY_TO], subject, html, reply_to: email }),
  });
  if (!r2.ok) {
    const detail = await r2.text();
    return new Response(JSON.stringify({ error: "resend failed", detail }), { status: 500 });
  }
  const data = await r2.json();
  return new Response(JSON.stringify({ ok: true, id: data?.id }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
