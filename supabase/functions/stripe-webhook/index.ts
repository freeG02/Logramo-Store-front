// @ts-nocheck — Deno Edge Function (Supabase)
// Stripe fulfillment webhook. Replaces the old PayPal `record-purchase`:
// Stripe POSTs a SIGNED event after the buyer pays; we verify the signature,
// then record the purchase(s), send the confirmation email, and fire the Meta
// Conversions API Purchase. Everything below comes from Stripe's verified event,
// never from the browser.
//
//   POST /stripe-webhook   (registered in the Stripe Dashboard)
//   handles:
//     checkout.session.completed            → card / Apple Pay / etc. (instant)
//     checkout.session.async_payment_succeeded → OXXO cleared (1–3 days later)
//
// Idempotent: keyed on the Checkout Session id (purchases.stripe_session_id), so
// a retried/duplicate event never double-inserts or double-emails.
//
// ENV required:
//   STRIPE_SECRET_KEY           (Supabase secret)
//   STRIPE_WEBHOOK_SECRET       (Supabase secret — the signing secret, whsec_…)
//   SUPABASE_URL                (auto)
//   SUPABASE_SERVICE_ROLE_KEY   (auto)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-06-20",
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

// Meta Conversions API (server-side Purchase). Dormant until META_CAPI_TOKEN is
// set. The browser fires the same Purchase with the same event_id (the Stripe
// session id), so Meta dedupes the pair into one conversion.
const META_PIXEL_ID = Deno.env.get("META_PIXEL_ID") ?? "4357191121163003";
const META_CAPI_TOKEN = Deno.env.get("META_CAPI_TOKEN") ?? "";
const META_API_VERSION = "v19.0";

const ZERO_DECIMAL = new Set(["BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG","RWF","UGX","VND","VUV","XAF","XOF","XPF"]);
// Stripe amount (minor units, or whole for zero-decimal) → human major amount.
function fromStripeAmount(amount: number, ccy: string): number {
  const c = String(ccy || "").toUpperCase();
  if (ZERO_DECIMAL.has(c)) return Math.round(Number(amount) || 0);
  return Math.round((Number(amount) || 0)) / 100;
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Fire-and-forget Purchase to the Conversions API. Never throws into the caller.
async function sendCapiPurchase(opts: {
  email: string; name: string | null; value: number; currency: string;
  orderId: string; contentIds: string[];
  contents: { id: string; quantity: number; item_price: number }[];
  ip: string; ua: string; fbc?: string; fbp?: string;
}): Promise<void> {
  if (!META_CAPI_TOKEN) return;
  if (!(Number.isFinite(opts.value) && opts.value > 0)) return;
  try {
    const em = opts.email ? [await sha256(opts.email)] : undefined;
    const parts = (opts.name ?? "").trim().split(/\s+/).filter(Boolean);
    const fn = parts.length ? [await sha256(parts[0])] : undefined;
    const ln = parts.length > 1 ? [await sha256(parts[parts.length - 1])] : undefined;
    const user_data: Record<string, unknown> = { em, fn, ln };
    if (opts.ip) user_data.client_ip_address = opts.ip;
    if (opts.ua) user_data.client_user_agent = opts.ua;
    if (opts.fbc) user_data.fbc = opts.fbc;
    if (opts.fbp) user_data.fbp = opts.fbp;
    const payload = {
      data: [{
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.orderId,            // dedup key, shared with the browser event
        action_source: "website",
        event_source_url: "https://logramo.com/gracias.html",
        user_data,
        custom_data: {
          currency: opts.currency,
          value: Math.round(opts.value * 100) / 100,
          content_type: "product",
          content_ids: opts.contentIds,
          contents: opts.contents,
          num_items: opts.contents.reduce((s, c) => s + (c.quantity || 1), 0) || opts.contentIds.length,
        },
      }],
    };
    await fetch(`https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (_e) { /* swallow — purchase is already recorded */ }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// Product ids already on file for this session (idempotency, per item).
async function recordedProductIds(sessionId: string): Promise<Set<string>> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/purchases?stripe_session_id=eq.${encodeURIComponent(sessionId)}&select=product_id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!r.ok) return new Set();
  const rows = await r.json().catch(() => []);
  return new Set((Array.isArray(rows) ? rows : []).map((x: any) => String(x?.product_id ?? "")));
}

// Fulfill a paid Checkout Session: record rows + email + Meta CAPI. Idempotent.
async function fulfill(session: any, req: Request): Promise<void> {
  const sessionId = String(session.id);
  const already = await recordedProductIds(sessionId);

  const md = session.metadata || {};
  const currency = String(session.currency || "usd").toUpperCase();
  const details = session.customer_details || {};
  const email = String(details.email || "").trim();
  const name = String(details.name || "").trim() || null;
  if (!email) return; // nothing to fulfill to

  // Line items carry the per-product amount + the product_id we stamped onto
  // product_data.metadata in create-checkout-session.
  let lines: { productId: string | null; amount: number }[] = [];
  try {
    const li = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ["data.price.product"] });
    lines = (li.data || []).map((it: any) => {
      const prod = it?.price?.product;
      const pid = (prod && typeof prod === "object" && prod.metadata && prod.metadata.product_id) ? String(prod.metadata.product_id) : "";
      return { productId: pid || null, amount: fromStripeAmount(it.amount_total, currency) };
    });
  } catch (_e) { /* fall back to metadata below */ }
  if (!lines.length) {
    const ids = String(md.product_ids || "").split(",").map((s) => s.trim()).filter(Boolean);
    const total = fromStripeAmount(session.amount_total, currency);
    lines = ids.length
      ? ids.map((id, i) => ({ productId: id, amount: i === 0 ? total : 0 }))
      : [{ productId: null, amount: total }];
  }

  const recorded: string[] = [];
  const emailItems: { product_id: string | null; amount: number }[] = [];
  for (const line of lines) {
    if (already.has(String(line.productId ?? ""))) continue;
    const row: any = {
      email, payer_name: name, product_id: line.productId,
      amount: line.amount, currency, stripe_session_id: sessionId, status: "completed",
      channel: md.channel || null, country: md.country || null,
    };
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (ins.ok) { recorded.push(line.productId ?? ""); already.add(String(line.productId ?? "")); emailItems.push({ product_id: line.productId, amount: line.amount }); }
  }

  // ONE confirmation email for the whole order (a download link per guide).
  if (emailItems.length) {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-purchase`, {
        method: "POST",
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ order: { email, payer_name: name, currency, stripe_session_id: sessionId, items: emailItems } }),
      });
    } catch (_e) { /* swallow — purchase is already recorded */ }
  }

  // Server-side Purchase to Meta, only on the run that recorded rows.
  if (recorded.length) {
    const orderTotal = fromStripeAmount(session.amount_total, currency) || lines.reduce((s, l) => s + (l.amount || 0), 0);
    const contentIds = lines.map((l) => l.productId).filter((x): x is string => !!x);
    // Per-item price detail so Meta sees real, varied price info per Purchase.
    const contents = lines
      .filter((l) => l.productId)
      .map((l) => ({ id: String(l.productId), quantity: 1, item_price: Math.round((l.amount || 0) * 100) / 100 }));
    await sendCapiPurchase({
      email, name, value: orderTotal, currency, orderId: sessionId, contentIds, contents,
      ip: (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim(),
      ua: req.headers.get("user-agent") ?? "",
      fbc: md.fbc || "", fbp: md.fbp || "",
    });
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
  if (!SERVICE_KEY || !STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) return json({ ok: false, reason: "server_misconfigured" }, 500);

  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();
  let event: any;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, STRIPE_WEBHOOK_SECRET, undefined, cryptoProvider);
  } catch (e: any) {
    return json({ ok: false, reason: "bad_signature", detail: String(e?.message || e) }, 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        // Card/instant methods are paid now; an OXXO session arrives here as
        // "unpaid" and is fulfilled later via async_payment_succeeded.
        if (s.payment_status === "paid") await fulfill(s, req);
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        await fulfill(event.data.object, req);
        break;
      }
      // Logged but no row: payment never cleared.
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        break;
    }
  } catch (e: any) {
    // 500 so Stripe retries; fulfillment is idempotent so retries are safe.
    return json({ ok: false, reason: "handler_error", detail: String(e?.message || e) }, 500);
  }

  return json({ received: true });
});
