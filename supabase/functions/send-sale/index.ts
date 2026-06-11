// @ts-nocheck — Deno Edge Function (Supabase)
// Sends a sale / urgency broadcast to the newsletter list. Triggered manually
// from the admin "Sale email" composer.
//
//   POST /send-sale
//     headers: Authorization: Bearer <admin access token>
//     body: {
//       subject, headline, subtitle, discount, code, expiry, ctaLabel, ctaUrl,
//       testTo?      // if set, send ONLY to this address (proof), don't broadcast
//     }
//   → admin-gated (is_admin profile). Builds the urgency template and either
//     sends a single proof (testTo) or broadcasts to all active subscribers.
//
// {name} in subject/subtitle is replaced with the recipient's first name.
//
// Deployed with --no-verify-jwt; we verify the admin token ourselves.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  RESEND_API_KEY, SUPABASE_URL, SUPABASE_KEY, SITE_URL,
  esc, broadcast, fetchActiveSubscribers,
} from "../_shared/email.ts";

const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });
}

// Same admin check as reset-data: resolve token → user, then is_admin on profile.
async function verifyAdmin(token: string): Promise<string | null> {
  if (!token) return null;
  const ures = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY || SUPABASE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!ures.ok) return null;
  const uid = (await ures.json().catch(() => null))?.id;
  if (!uid) return null;
  const pres = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=is_admin`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  if (!pres.ok) return null;
  const rows = await pres.json().catch(() => []);
  return rows?.[0]?.is_admin === true ? uid : null;
}

function fillName(t: string, firstName: string): string {
  if (!t) return t;
  if (t.indexOf("{name}") === -1) return t;
  return firstName ? t.split("{name}").join(firstName) : t.replace(/\{name\}[,]?\s*/g, "");
}

function withUtm(url: string): string {
  if (!url) return `${SITE_URL}/biblioteca.html?utm_source=email&utm_campaign=sale`;
  if (url.indexOf("utm_source=") !== -1) return url;
  return url + (url.indexOf("?") === -1 ? "?" : "&") + "utm_source=email&utm_campaign=sale";
}

function saleInner(f: any, firstName: string): string {
  const greeting = firstName
    ? `${esc(firstName)},<br>esto te va a <span style="color:#C55932;font-style:italic;">interesar.</span>`
    : `Esto te va a <span style="color:#C55932;font-style:italic;">interesar.</span>`;
  const subtitle = fillName(f.subtitle || "Tenemos algo especial por tiempo limitado — y queríamos que te enteraras primero.", firstName);
  const ctaUrl = withUtm(f.ctaUrl);
  const ctaLabel = f.ctaLabel || "Ver la oferta";

  const discountBlock = f.discount
    ? `<div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:72px;line-height:.9;letter-spacing:-.04em;color:#F6D055;margin:0 0 6px;">${esc(f.discount)}</div>`
    : "";
  const codeBlock = f.code
    ? `<div style="margin:24px 0 8px;"><div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(254,250,232,.6);margin-bottom:8px;">Tu código</div>
        <div style="display:inline-block;background:#FEFAE8;border:2px dashed #111A17;border-radius:10px;padding:12px 22px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:22px;letter-spacing:.12em;color:#111A17;">${esc(f.code)}</div></div>`
    : "";
  const expiryBlock = f.expiry
    ? `<p style="margin:18px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#F6D055;">⏳ Válido hasta ${esc(f.expiry)} — después vuelve a su precio normal.</p>`
    : "";

  return `<tr><td style="padding:54px 32px 36px;">
      <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C55932;margin-bottom:18px;">Oferta por tiempo limitado</div>
      <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:56px;line-height:.92;letter-spacing:-.035em;text-transform:uppercase;color:#111A17;">${greeting}</h1>
      <p style="margin:26px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.5;color:#3C4824;max-width:440px;">${esc(subtitle)}</p>
    </td></tr>
    <tr><td style="background:#3C4824;padding:48px 32px;color:#FEFAE8;text-align:center;">
      ${discountBlock}
      <h2 style="margin:0 0 6px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:34px;line-height:1.02;letter-spacing:-.02em;text-transform:uppercase;color:#FEFAE8;">${esc(f.headline || "Oferta especial")}</h2>
      ${codeBlock}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:26px auto 0;"><tr>
        <td style="background:#F6D055;border:2px solid #111A17;border-radius:12px;box-shadow:4px 4px 0 #111A17;">
          <a href="${esc(ctaUrl)}" style="display:inline-block;padding:15px 30px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:#111A17;text-decoration:none;">${esc(ctaLabel)} &nbsp;→</a>
        </td>
      </tr></table>
      ${expiryBlock}
    </td></tr>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
  if (!RESEND_API_KEY) return json({ ok: false, reason: "server_misconfigured" }, 500);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!(await verifyAdmin(token))) return json({ ok: false, reason: "not_admin" }, 403);

  let f: any = {};
  try { f = await req.json(); } catch { return json({ ok: false, reason: "invalid_json" }, 400); }
  if (!f.headline && !f.subject) return json({ ok: false, reason: "missing_headline" }, 400);

  const subjectFn = (firstName: string) =>
    fillName(f.subject || (firstName ? "{name}, oferta por tiempo limitado en Logramo" : "Oferta por tiempo limitado en Logramo"), firstName);

  const testTo = String(f.testTo ?? "").trim();
  const recipients = testTo
    ? [{ email: testTo }]
    : await fetchActiveSubscribers();

  if (!recipients.length) return json({ ok: true, recipients: 0, sent: 0, note: "no_active_subscribers" });

  const res = await broadcast({
    recipients,
    title: "Oferta · Logramo",
    eyebrow: "Oferta",
    reasonLine: "Te llegó este email porque te apuntaste a las guías en logramo.com.",
    subject: subjectFn,
    buildInner: (firstName) => saleInner(f, firstName),
  });

  return json({ ok: res.failed === 0, test: !!testTo, ...res });
});
