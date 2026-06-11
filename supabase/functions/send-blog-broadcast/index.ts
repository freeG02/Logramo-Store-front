// @ts-nocheck — Deno Edge Function (Supabase)
// Announces newly-published blog articles to the newsletter list.
//
// Run on a Supabase Cron (e.g. every 15 min). Finds articles that are live
// (published, publish_at in the past or null) and not yet announced
// (announced_at IS NULL), emails the active subscriber list, then stamps
// announced_at so each article is sent exactly once. Idempotent.
//
//   GET/POST /send-blog-broadcast            → run
//   GET/POST /send-blog-broadcast?dryRun=1   → count candidates, send nothing
//
// NOTE: the migration backfills announced_at on all existing rows, so only
// articles created AFTER deploy will ever be announced.
//
// ENV required: RESEND_API_KEY, UNSUB_SECRET, SUPABASE_URL,
//               SUPABASE_SERVICE_ROLE_KEY (all auto-injected except secrets).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  RESEND_API_KEY, SUPABASE_URL, SUPABASE_KEY, SITE_URL,
  esc, broadcast, fetchActiveSubscribers, sbPatch,
} from "../_shared/email.ts";

// Safety cap: never announce anything created more than this long ago, even if
// announced_at somehow got left NULL. The backfill is the real guard; this is
// belt-and-suspenders against a bad row.
const MAX_AGE_DAYS = 14;

async function fetchArticlesToAnnounce(): Promise<any[]> {
  const nowIso = new Date().toISOString();
  const minIso = new Date(Date.now() - MAX_AGE_DAYS * 864e5).toISOString();
  // published & not announced & recent & (no schedule OR schedule already passed)
  const q = [
    "select=id,title,excerpt,image_url,read_time,publish_at,created_at",
    "published=eq.true",
    "announced_at=is.null",
    `created_at=gte.${minIso}`,
    `or=(publish_at.is.null,publish_at.lte.${encodeURIComponent(nowIso)})`,
    "order=created_at.asc",
  ].join("&");
  const r = await fetch(`${SUPABASE_URL}/rest/v1/articles?${q}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) throw new Error(`articles query failed: ${await r.text()}`);
  return await r.json();
}

function blogInner(article: any, firstName: string): string {
  const url = `${SITE_URL}/blog-post.html?id=${encodeURIComponent(article.id)}&utm_source=email&utm_campaign=blog`;
  const greeting = firstName
    ? `${esc(firstName)},<br>algo nuevo<br>para <span style="color:#C55932;font-style:italic;">leer.</span>`
    : `Algo nuevo<br>para <span style="color:#C55932;font-style:italic;">leer.</span>`;
  const readTime = article.read_time ? `${article.read_time} min de lectura` : "Lectura cortita";
  const img = article.image_url
    ? `<tr><td style="padding:0;"><a href="${url}" style="text-decoration:none;"><img src="${esc(article.image_url)}" alt="${esc(article.title)}" width="600" style="display:block;width:100%;height:auto;border:0;"></a></td></tr>`
    : "";

  return `<tr><td style="padding:54px 32px 36px;">
      <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C55932;margin-bottom:18px;">Recién salido del horno</div>
      <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:58px;line-height:.92;letter-spacing:-.035em;text-transform:uppercase;color:#111A17;">${greeting}</h1>
      <p style="margin:26px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.5;color:#3C4824;max-width:440px;">
        Acabamos de publicar algo que creemos que te va a servir. Cero relleno — directo a lo que te ayuda con tu perro.
      </p>
    </td></tr>
    ${img}
    <tr><td style="background:#3C4824;padding:48px 32px;color:#FEFAE8;">
      <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#F6D055;margin-bottom:16px;">El artículo · ${esc(readTime)}</div>
      <h2 style="margin:0 0 12px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:32px;line-height:1.02;letter-spacing:-.02em;text-transform:uppercase;color:#FEFAE8;">${esc(article.title)}</h2>
      ${article.excerpt ? `<p style="margin:0 0 26px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.55;color:rgba(254,250,232,.82);">${esc(article.excerpt)}</p>` : `<div style="height:8px"></div>`}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background:#F6D055;border:2px solid #111A17;border-radius:12px;box-shadow:4px 4px 0 #111A17;">
          <a href="${url}" style="display:inline-block;padding:14px 26px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#111A17;text-decoration:none;">Leer el artículo &nbsp;→</a>
        </td>
      </tr></table>
    </td></tr>`;
}

async function run(dryRun: boolean): Promise<any> {
  const articles = await fetchArticlesToAnnounce();
  const summary = { dryRun, candidates: articles.length, sent: 0, announced: 0, recipients: 0, articles: [] as any[], errors: [] as string[] };
  if (!articles.length) return summary;

  const recipients = await fetchActiveSubscribers();
  summary.recipients = recipients.length;

  for (const a of articles) {
    const subject = (firstName: string) =>
      firstName ? `${firstName}, nuevo en el blog: ${a.title}` : `Nuevo en el blog: ${a.title}`;
    const res = await broadcast({
      recipients,
      title: `${a.title} · Logramo`,
      eyebrow: "Nuevo en el blog",
      reasonLine: "Te llegó este email porque te apuntaste a las guías en logramo.com.",
      subject,
      buildInner: (firstName) => blogInner(a, firstName),
      dryRun,
    });
    summary.sent += res.sent;
    if (res.errors.length) summary.errors.push(`article ${a.id}: ${res.errors.join("; ")}`);
    summary.articles.push({ id: a.id, title: a.title, sent: res.sent, failed: res.failed });

    // Mark announced if we delivered to at least someone, or there was simply
    // no one to send to. Total failure leaves it NULL so the next run retries.
    if (!dryRun && (res.sent > 0 || recipients.length === 0)) {
      const ok = await sbPatch("articles", `id=eq.${a.id}`, { announced_at: new Date().toISOString() });
      if (ok) summary.announced++;
    }
  }
  return summary;
}

serve(async (req: Request) => {
  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  try {
    const summary = await run(dryRun);
    return new Response(JSON.stringify(summary), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
