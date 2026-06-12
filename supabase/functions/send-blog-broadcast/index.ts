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
  esc, broadcast, fetchActiveSubscribers, sbPatch, bookFrame, fetchProduct,
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
    "select=id,title,excerpt,image_url,read_time,related_product_id,publish_at,created_at",
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

function recommendation(product: any): string {
  if (!product) return "";
  const purl = `${SITE_URL}/producto.html?id=${encodeURIComponent(product.id)}&utm_source=email&utm_campaign=blog`;
  const frame = bookFrame({
    coverImage: product.cover_image, coverColor: product.cover_color,
    coverSub: product.cover_sub, coverTitle: product.cover_title || product.title,
    width: 140, href: purl,
  });
  return `<tr><td style="background:#F8F3D9;padding:38px 32px;">
      <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C55932;margin-bottom:20px;">Y si quieres profundizar…</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="top" style="width:170px;padding-right:20px;">${frame}</td>
        <td valign="top">
          <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:22px;line-height:1.05;letter-spacing:-.01em;color:#111A17;">${esc(product.title || "")}</div>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.5;color:#3C4824;margin:8px 0 18px;">La guía que va de la mano con este artículo. Todo en un solo lugar, paso a paso. 📖</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="background:#C55932;border:2px solid #111A17;border-radius:10px;box-shadow:3px 3px 0 #111A17;">
              <a href="${purl}" style="display:inline-block;padding:11px 20px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#FEFAE8;text-decoration:none;">Ver la guía &nbsp;→</a>
            </td>
          </tr></table>
        </td>
      </tr></table>
    </td></tr>`;
}

function blogInner(article: any, product: any, firstName: string): string {
  const url = `${SITE_URL}/blog-post.html?id=${encodeURIComponent(article.id)}&utm_source=email&utm_campaign=blog`;
  const greeting = firstName
    ? `${esc(firstName)},<br>esto te va a <span style="color:#C55932;font-style:italic;">gustar.</span>`
    : `Esto te va a <span style="color:#C55932;font-style:italic;">gustar.</span>`;
  const readTime = article.read_time ? `${article.read_time} min de lectura` : "Lectura cortita";
  const img = article.image_url
    ? `<tr><td style="padding:0;"><a href="${url}" style="text-decoration:none;"><img src="${esc(article.image_url)}" alt="${esc(article.title)}" width="600" style="display:block;width:100%;height:auto;border:0;"></a></td></tr>`
    : "";

  return `<tr><td style="padding:54px 32px 36px;">
      <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C55932;margin-bottom:18px;">Recién salido del horno</div>
      <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:58px;line-height:.92;letter-spacing:-.035em;text-transform:uppercase;color:#111A17;">${greeting}</h1>
      <p style="margin:26px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.5;color:#3C4824;max-width:440px;">
        Publicamos algo nuevo y nos acordamos de ti. Cero relleno, directo a lo que de verdad te ayuda con tu perro. ✨
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
    </td></tr>
    ${recommendation(product)}`;
}

async function run(dryRun: boolean): Promise<any> {
  const articles = await fetchArticlesToAnnounce();
  const summary = { dryRun, candidates: articles.length, sent: 0, announced: 0, recipients: 0, articles: [] as any[], errors: [] as string[] };
  if (!articles.length) return summary;

  const recipients = await fetchActiveSubscribers();
  summary.recipients = recipients.length;

  for (const a of articles) {
    const product = await fetchProduct(a.related_product_id);
    // Subject = the blog title itself (more clickable than a generic line).
    const res = await broadcast({
      recipients,
      title: `${a.title} · Logramo`,
      eyebrow: "Nuevo en el blog",
      reasonLine: "Te llegó este email porque te uniste a Logramo en logramo.com.",
      subject: () => a.title,
      buildInner: (firstName) => blogInner(a, product, firstName),
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

// Preview: send ONE blog announcement (newest live article, or a sample) to a
// single address. Does not touch announced_at or the subscriber list.
async function sendPreview(testTo: string): Promise<any> {
  let a: any = null;
  const sel = "select=id,title,excerpt,image_url,read_time,related_product_id&published=eq.true&order=created_at.desc&limit=1";
  const hdr = { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } };
  try {
    // Prefer an article that has a related product, so the preview shows the recommendation.
    let r = await fetch(`${SUPABASE_URL}/rest/v1/articles?${sel}&related_product_id=not.is.null`, hdr);
    let rows = r.ok ? await r.json() : [];
    if (!Array.isArray(rows) || !rows.length) {
      r = await fetch(`${SUPABASE_URL}/rest/v1/articles?${sel}`, hdr);
      rows = r.ok ? await r.json() : [];
    }
    a = Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (_e) { /* fall back to sample */ }
  if (!a) a = { id: "preview", title: "Cómo enseñar a tu perro a quedarse solo en casa", excerpt: "Sin dramas ni culpa: un plan corto para que tu perro aprenda a estar tranquilo cuando sales.", image_url: "", read_time: 6 };
  // For the preview, fall back to any published product so the recommendation shows.
  let product = await fetchProduct(a.related_product_id);
  if (!product) {
    try {
      const pr = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,title,cover_color,cover_sub,cover_title,cover_image&published=eq.true&order=created_at.asc&limit=1`, hdr);
      const prows = pr.ok ? await pr.json() : [];
      product = Array.isArray(prows) && prows.length ? prows[0] : null;
    } catch (_e) { /* no rec */ }
  }
  const res = await broadcast({
    recipients: [{ email: testTo }],
    title: `${a.title} · Logramo`,
    eyebrow: "Nuevo en el blog",
    reasonLine: "Te llegó este email porque te uniste a Logramo en logramo.com.",
    subject: () => a.title,
    buildInner: (fn) => blogInner(a, product, fn),
  });
  return { preview: true, to: testTo, article: a.title, ...res };
}

serve(async (req: Request) => {
  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });
  const url = new URL(req.url);
  const testTo = url.searchParams.get("testTo");
  const dryRun = url.searchParams.get("dryRun") === "1";
  try {
    const summary = testTo ? await sendPreview(testTo) : await run(dryRun);
    return new Response(JSON.stringify(summary), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
