// @ts-nocheck — Deno Edge Function (Supabase)
// One-click newsletter unsubscribe for Logramo.
//
//   GET  /unsubscribe?email=…&token=…   → verify, flag, render confirmation page
//   POST /unsubscribe?email=…&token=…   → RFC 8058 one-click (List-Unsubscribe-Post)
//        (also accepts the same params in a form/JSON body)
//
// The token is HMAC-SHA256(normalized-email, UNSUB_SECRET) hex. The broadcast
// and welcome functions build the same token so links validate without a DB
// lookup. Flags public.subscribers.unsubscribed_at = now().
//
// ENV required:
//   UNSUB_SECRET               (shared secret; same value used by senders)
//   SUPABASE_URL               (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY  (auto-injected; bypasses RLS for the update)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const UNSUB_SECRET = Deno.env.get("UNSUB_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

function normEmail(email: string): string {
  return String(email ?? "").trim().toLowerCase();
}

async function makeToken(email: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(UNSUB_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(normEmail(email)));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time-ish compare
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function flagUnsubscribed(email: string): Promise<boolean> {
  const url = `${SUPABASE_URL}/rest/v1/subscribers?email=eq.${encodeURIComponent(email.trim())}`;
  const r = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }),
  });
  return r.ok;
}

function page(opts: { ok: boolean; email: string }): string {
  const title = opts.ok ? "Suscripción cancelada" : "No pudimos procesar tu solicitud";
  const headline = opts.ok
    ? `Listo,<br>te <span style="color:#C55932;font-style:italic;">borramos.</span>`
    : `Ups,<br>algo <span style="color:#C55932;font-style:italic;">falló.</span>`;
  const body = opts.ok
    ? `Ya no te enviaremos más correos del boletín${opts.email ? ` a <strong>${opts.email}</strong>` : ""}. Sin rencores — la puerta queda abierta si algún día quieres volver.`
    : `Ese enlace no es válido o ya expiró. Si quieres dejar de recibir correos, escríbenos a <a href="mailto:ayuda@logramo.com" style="color:#C55932;">ayuda@logramo.com</a> y lo hacemos a mano.`;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${title} · Logramo</title></head>
<body style="margin:0;padding:0;background:#d6d4c8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#d6d4c8;"><tr><td align="center" style="padding:48px 16px;">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="width:520px;max-width:100%;background:#FEFAE8;border:2px solid #111A17;border-radius:16px;box-shadow:6px 6px 0 #111A17;overflow:hidden;">
      <tr><td style="padding:48px 36px 40px;">
        <div style="font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C55932;margin-bottom:18px;">Logramo · boletín</div>
        <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:46px;line-height:.95;letter-spacing:-.03em;text-transform:uppercase;color:#111A17;">${headline}</h1>
        <p style="margin:26px 0 0;font-size:16px;line-height:1.55;color:#3C4824;">${body}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px;"><tr>
          <td style="background:#F6D055;border:2px solid #111A17;border-radius:12px;box-shadow:4px 4px 0 #111A17;">
            <a href="https://logramo.com" style="display:inline-block;padding:14px 26px;font-weight:900;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#111A17;text-decoration:none;">Ir a logramo.com &nbsp;→</a>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#ADCBEF;padding:20px 36px;border-top:2px solid #111A17;font-size:11px;color:#3C4824;">© Logramo · Hecho para perros y los humanos que los adoran</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

serve(async (req: Request) => {
  const url = new URL(req.url);

  // Collect email + token from query string (and, for POST, the body too).
  let email = url.searchParams.get("email") ?? "";
  let token = url.searchParams.get("token") ?? "";
  if (req.method === "POST") {
    try {
      const ct = req.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const b = await req.json();
        email = email || b?.email || "";
        token = token || b?.token || "";
      } else {
        const form = await req.formData();
        email = email || String(form.get("email") ?? "");
        token = token || String(form.get("token") ?? "");
      }
    } catch (_e) { /* params already from query string */ }
  } else if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!UNSUB_SECRET) return htmlResponse(page({ ok: false, email: "" }), 500);

  const valid = !!email && !!token && safeEqual(token, await makeToken(email));
  let ok = false;
  if (valid) ok = await flagUnsubscribed(email);

  // RFC 8058: mail clients POST and expect a 2xx — keep it lightweight.
  if (req.method === "POST") {
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  return htmlResponse(page({ ok, email }), ok ? 200 : 400);
});
