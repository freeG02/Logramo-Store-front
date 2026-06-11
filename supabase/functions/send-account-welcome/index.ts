// @ts-nocheck — Deno Edge Function (Supabase)
// Sends a branded welcome email to a freshly-signed-up customer.
// Triggered by AFTER INSERT on public.profiles via the
// profiles_welcome_insert pg_net trigger.
//
// ENV required:
//   RESEND_API_KEY

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM     = "Logramo <ayuda@logramo.com>";
const REPLY_TO = "ayuda@logramo.com";
const SITE_URL = "https://logramo.com";

function esc(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function cap(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; }
function firstName(s?: string | null): string {
  if (!s || !s.trim()) return "";
  return cap(s.trim().split(/\s+/)[0].slice(0, 20));
}

function buildHtml(opts: { name: string; email: string }): string {
  const greeting = opts.name
    ? `${esc(opts.name)},<br>tu cuenta<br>está <span style="color:#C55932;font-style:italic;">lista.</span>`
    : `Tu cuenta<br>está <span style="color:#C55932;font-style:italic;">lista.</span>`;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><title>Bienvenida a Logramo</title></head>
<body style="margin:0;padding:0;background:#d6d4c8;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:600px;max-width:100%;background:#FEFAE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111A17;">
  <tr><td style="padding:32px 32px 0;">
    <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C55932;margin-bottom:18px;">Tu cuenta · ${esc(opts.email)}</div>
    <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:54px;line-height:.92;letter-spacing:-.035em;text-transform:uppercase;color:#111A17;">${greeting}</h1>
  </td></tr>
  <tr><td style="padding:28px 32px 8px;">
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.55;color:#3C4824;">
      Ya puedes entrar a tu cuenta cuando quieras. Desde ahí podrás volver a descargar tus guías sin tener que buscar emails viejos.
    </p>
  </td></tr>
  <tr><td style="background:#3C4824;padding:40px 32px;color:#FEFAE8;margin-top:24px">
    <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#F6D055;margin-bottom:14px;">Empieza por aquí</div>
    <h2 style="margin:0 0 16px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:30px;line-height:1.05;letter-spacing:-.02em;text-transform:uppercase;color:#FEFAE8;">Toda la biblioteca, <em style="color:#F6D055;">para ti.</em></h2>
    <p style="margin:0 0 22px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.55;color:rgba(254,250,232,.85);">Guías de educación, conducta, salud y mucho más. Entra cuando quieras y empieza por la que más te haga falta hoy.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:#F6D055;border:2px solid #111A17;border-radius:12px;box-shadow:4px 4px 0 #111A17;">
        <a href="${SITE_URL}/biblioteca.html" style="display:inline-block;padding:14px 26px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#111A17;text-decoration:none;">Ver la biblioteca &nbsp;→</a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:32px 32px 12px;">
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.55;color:#5A6857;">
      ¿Dudas con tu perro? Abre el chat en <a href="${SITE_URL}" style="color:#C55932;text-decoration:underline;">logramo.com</a> o responde a este email. Estamos del otro lado.
    </p>
  </td></tr>
  <tr><td style="background:#ADCBEF;padding:18px 32px;text-align:center;border-top:2px solid #111A17;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#3C4824;">
    © Logramo · Hecho para perros y los humanos que los adoran
  </td></tr>
</table>
</body></html>`;
}

serve(async (req: Request) => {
  if (req.method === "GET") return new Response("Logramo send-account-welcome OK", { status: 200 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });

  let payload: any;
  try { payload = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid JSON" }), { status: 400 }); }

  const r = payload?.record ?? payload ?? {};
  const username: string = String(r.username ?? r.name ?? "").trim();
  const email: string = String(r.email ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "bad email" }), { status: 400 });
  }

  const name = firstName(username);
  const subject = name ? `${name}, tu cuenta de Logramo está lista` : "Tu cuenta de Logramo está lista";
  const html = buildHtml({ name, email });

  const r2 = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [email], subject, html, reply_to: REPLY_TO }),
  });
  if (!r2.ok) {
    const detail = await r2.text();
    return new Response(JSON.stringify({ error: "resend failed", detail }), { status: 500 });
  }
  const data = await r2.json();
  return new Response(JSON.stringify({ ok: true, id: data?.id }), {
    status: 200, headers: { "Content-Type": "application/json" }
  });
});
