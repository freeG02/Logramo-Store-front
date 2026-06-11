// @ts-nocheck — shared helpers for Logramo broadcast emails (blog + sale).
// Deno / Supabase Edge runtime.
import { LOGO_SVG } from "./logo.ts";

export const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
export const UNSUB_SECRET = Deno.env.get("UNSUB_SECRET") ?? "";
export const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
export const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
export const FUNCTIONS_BASE = SUPABASE_URL + "/functions/v1";
export const FROM = "Logramo <ayuda@logramo.com>";
export const REPLY_TO = "ayuda@logramo.com";
export const SITE_URL = "https://logramo.com";

// Real social accounts (kept in sync with the site footer in partials.js).
export const SOCIAL = {
  fb: "https://www.facebook.com/profile.php?id=61590239832119",
  yt: "https://youtube.com/@megusta_logramo",
  pin: "https://pin.it/4WgVTqM4j",
};

export function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

export function logo(width: number, height: number, color: string): string {
  return LOGO_SVG.replace("WW", String(width)).replace("HH", String(height)).replace("COLOR", color);
}

export function monthYear(d: Date = new Date()): string {
  const m = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  return `${m[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
}

const GENERIC_PREFIXES = new Set([
  "info", "hola", "contacto", "admin", "test", "soporte", "support", "no-reply",
  "noreply", "newsletter", "ventas", "sales", "ayuda", "help", "mail", "email",
  "team", "equipo", "root", "postmaster", "webmaster", "contact",
]);

// Greeting first name: prefer the stored name, else a smart parse of the email
// local-part (strip digits, skip generic inboxes). Returns "" when nothing safe.
export function smartFirstName(email: string, name?: string | null): string {
  if (name && name.trim()) return cap(name.trim().split(/\s+/)[0].slice(0, 20));
  const local = (String(email ?? "").split("@")[0] || "").trim();
  if (!local) return "";
  const parts = local.split(/[._\-+]+/).filter(Boolean);
  if (!parts.length) return "";
  const candidate = parts[0].replace(/\d+/g, "");
  if (!candidate || candidate.length < 3) return "";
  if (GENERIC_PREFIXES.has(candidate.toLowerCase())) return "";
  return cap(candidate.slice(0, 20));
}

// Signed one-click unsubscribe URL. Token MUST match the `unsubscribe` function:
// HMAC-SHA256(lowercased email, UNSUB_SECRET), hex.
export async function unsubUrl(email: string): Promise<string> {
  const norm = String(email ?? "").trim().toLowerCase();
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(UNSUB_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(norm));
  const token = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${FUNCTIONS_BASE}/unsubscribe?email=${encodeURIComponent(email.trim())}&token=${token}`;
}

function headerHtml(eyebrow: string): string {
  return `<tr><td style="padding:24px 32px 18px;border-bottom:1px solid rgba(17,26,23,.12);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="left" valign="middle">${logo(130, 20, "#C55932")}</td>
      <td align="right" valign="middle" style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#3C4824;">${esc(eyebrow)} · ${monthYear()}</td>
    </tr></table>
  </td></tr>`;
}

function footerHtml(unsub: string, reasonLine: string): string {
  return `<tr><td style="background:#ADCBEF;padding:34px 32px;text-align:center;border-top:2px solid #111A17;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;"><tr>
      <td style="padding:0 10px;"><a href="${SOCIAL.fb}" style="text-decoration:none;display:inline-block;"><img src="https://cdn.simpleicons.org/facebook/111A17" alt="Facebook" width="26" height="26" style="display:block;border:0;"></a></td>
      <td style="padding:0 10px;"><a href="${SOCIAL.yt}" style="text-decoration:none;display:inline-block;"><img src="https://cdn.simpleicons.org/youtube/111A17" alt="YouTube" width="26" height="26" style="display:block;border:0;"></a></td>
      <td style="padding:0 10px;"><a href="${SOCIAL.pin}" style="text-decoration:none;display:inline-block;"><img src="https://cdn.simpleicons.org/pinterest/111A17" alt="Pinterest" width="26" height="26" style="display:block;border:0;"></a></td>
    </tr></table>
    <div style="margin-bottom:12px;line-height:0;">${logo(110, 16, "#C55932")}</div>
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#3C4824;">
      ${reasonLine}<br>
      ¿No quieres más correos? <a href="${unsub}" style="color:#C55932;text-decoration:underline;">Cancela la suscripción</a>
    </div>
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(60,72,36,.55);margin-top:14px;">© Logramo · Hecho para perros y los humanos que los adoran</div>
  </td></tr>`;
}

// Full email document: cream magazine shell with header + body + sky footer.
export function wrap(opts: { title: string; eyebrow: string; inner: string; unsub: string; reasonLine: string }): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#d6d4c8;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:600px;max-width:100%;background:#FEFAE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111A17;">
${headerHtml(opts.eyebrow)}
${opts.inner}
${footerHtml(opts.unsub, opts.reasonLine)}
</table>
</body></html>`;
}

// All newsletter subscribers who have NOT unsubscribed. Paginates past the
// PostgREST 1000-row cap.
export async function fetchActiveSubscribers(): Promise<{ email: string }[]> {
  const out: { email: string }[] = [];
  let offset = 0;
  const pageSize = 1000;
  // deno-lint-ignore no-constant-condition
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/subscribers?select=email&unsubscribed_at=is.null&order=created_at.asc&limit=${pageSize}&offset=${offset}`;
    const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!r.ok) break;
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      const email = String(row.email ?? "").trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) out.push({ email });
    }
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

export async function sbPatch(table: string, query: string, patch: unknown): Promise<boolean> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
  return r.ok;
}

// Send up to 100 fully-personalized messages per Resend batch call.
async function sendChunk(messages: unknown[]): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
  if (!r.ok) return { ok: false, error: await r.text() };
  return { ok: true };
}

export interface BroadcastOpts {
  recipients: { email: string }[];
  title: string;
  eyebrow: string;
  reasonLine: string;
  subject: (firstName: string) => string;
  buildInner: (firstName: string) => string;
  dryRun?: boolean;
}

// Personalize + batch-send to every recipient. Each message carries its own
// greeting, unsubscribe link and List-Unsubscribe headers.
export async function broadcast(o: BroadcastOpts): Promise<{ recipients: number; sent: number; failed: number; errors: string[] }> {
  const result = { recipients: o.recipients.length, sent: 0, failed: 0, errors: [] as string[] };
  if (o.dryRun) return result;

  const chunkSize = 100;
  for (let i = 0; i < o.recipients.length; i += chunkSize) {
    const slice = o.recipients.slice(i, i + chunkSize);
    const messages = await Promise.all(slice.map(async (rcpt) => {
      const firstName = smartFirstName(rcpt.email);
      const unsub = await unsubUrl(rcpt.email);
      const html = wrap({
        title: o.title, eyebrow: o.eyebrow, reasonLine: o.reasonLine, unsub,
        inner: o.buildInner(firstName),
      });
      return {
        from: FROM, to: [rcpt.email], subject: o.subject(firstName), html, reply_to: REPLY_TO,
        headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      };
    }));
    const r = await sendChunk(messages);
    if (r.ok) result.sent += slice.length;
    else { result.failed += slice.length; result.errors.push(r.error || "batch failed"); }
  }
  return result;
}
