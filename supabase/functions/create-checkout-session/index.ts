// @ts-nocheck — Deno Edge Function (Supabase)
// Creates a Stripe Checkout Session (hosted, redirect) for one or more guides.
//
//   POST /create-checkout-session
//     body: { items:[{id, qty}], currency?, client_amounts?, channel?, country?,
//             fbc?, fbp?, origin? }
//   → { url }  (browser then does window.location = url)
//
// Trust model: prices come from the products table (USD `price`), NEVER from the
// client. The server converts USD → the buyer's currency with its own live FX
// fetch. `client_amounts` (the localized prices the buyer actually saw) are
// honored ONLY when they sit within a sane band of the server figure, so the
// charge matches the display but a tampered/low-balled price is rejected.
//
// Fulfillment is NOT done here — it happens in `stripe-webhook` after Stripe
// confirms the payment (instant for card, days later for OXXO). This function
// just builds the session.
//
// ENV required:
//   STRIPE_SECRET_KEY            (Supabase secret — NEVER commit this)
//   SUPABASE_URL                 (auto)
//   SUPABASE_SERVICE_ROLE_KEY    (auto)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-06-20",
});

// Meta Conversions API (server-side InitiateCheckout). Dormant until
// META_CAPI_TOKEN is set. The browser fires the same InitiateCheckout with the
// same event_id (ic_event_id), so Meta dedupes the pair into one event and the
// server's CAPI coverage matches the pixel.
const META_PIXEL_ID = Deno.env.get("META_PIXEL_ID") ?? "4357191121163003";
const META_CAPI_TOKEN = Deno.env.get("META_CAPI_TOKEN") ?? "";
const META_API_VERSION = "v19.0";

// Fire-and-forget InitiateCheckout to the Conversions API. Never throws.
async function sendCapiInitiateCheckout(opts: {
  eventId: string; value: number; currency: string;
  contents: { id: string; quantity: number; item_price: number }[];
  ids: string[]; ip: string; ua: string; fbc?: string; fbp?: string; sourceUrl: string;
}): Promise<void> {
  if (!META_CAPI_TOKEN || !opts.eventId) return;
  if (!(Number.isFinite(opts.value) && opts.value > 0)) return;
  try {
    const user_data: Record<string, unknown> = {};
    if (opts.ip) user_data.client_ip_address = opts.ip;
    if (opts.ua) user_data.client_user_agent = opts.ua;
    if (opts.fbc) user_data.fbc = opts.fbc;
    if (opts.fbp) user_data.fbp = opts.fbp;
    const payload = {
      data: [{
        event_name: "InitiateCheckout",
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.eventId,            // dedup key, shared with the browser event
        action_source: "website",
        event_source_url: `${opts.sourceUrl}/biblioteca.html`,
        user_data,
        custom_data: {
          currency: opts.currency,
          value: Math.round(opts.value * 100) / 100,
          content_type: "product",
          content_ids: opts.ids,
          contents: opts.contents,
          num_items: opts.contents.reduce((s, c) => s + (c.quantity || 1), 0),
        },
      }],
    };
    await fetch(`https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (_e) { /* swallow — checkout still proceeds */ }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });
}

// Stripe presentment currencies we allow. Anything else (or a Stripe rejection)
// falls back to USD so a session is always created. Mirrors STRIPE_OK in script.js.
const STRIPE_OK = new Set([
  "USD","EUR","GBP","AUD","BRL","CAD","CHF","CZK","DKK","HKD","HUF","ILS","JPY","MXN","NOK","NZD",
  "PHP","PLN","SEK","SGD","THB","TWD","ARS","CLP","COP","PEN","UYU","PYG","BOB","GTQ","HNL","NIO",
  "CRC","DOP","JMD","TTD","INR","KRW","TRY","ZAR","IDR","MYR","VND","SAR","AED","EGP","MAD","NGN",
  "KES","RON","BGN","UAH","ISK","CNY",
]);
// Stripe zero-decimal currencies — amount is passed in whole units, not ×100.
const ZERO_DECIMAL = new Set(["BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG","RWF","UGX","VND","VUV","XAF","XOF","XPF"]);
// Stripe currencies whose minor-unit amount must be evenly divisible by 100.
const DIVISIBLE_100 = new Set(["HUF","TWD","ISK","UGX"]);

// Convert a major-unit amount in `ccy` to the integer Stripe expects (minor units,
// except zero-decimal currencies which take whole units).
function toStripeAmount(major: number, ccy: string): number {
  if (ZERO_DECIMAL.has(ccy)) return Math.round(major);
  if (DIVISIBLE_100.has(ccy)) return Math.round(major) * 100;
  return Math.round(major * 100);
}

// Live USD→ccy rate, same sources the storefront uses. 0 means "couldn't fetch".
async function usdRate(ccy: string): Promise<number> {
  if (ccy === "USD") return 1;
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (r.ok) { const d = await r.json(); const v = d?.rates?.[ccy]; if (v) return Number(v); }
  } catch (_e) { /* fall through */ }
  try {
    const r = await fetch("https://api.frankfurter.app/latest?from=USD&to=" + ccy, { cache: "no-store" });
    if (r.ok) { const d = await r.json(); const v = d?.rates?.[ccy]; if (v) return Number(v); }
  } catch (_e) { /* fall through */ }
  return 0;
}

async function fetchProducts(ids: string[]): Promise<Map<string, any>> {
  const out = new Map<string, any>();
  if (!ids.length) return out;
  const list = ids.map((id) => `"${id}"`).join(",");
  const r = await fetch(`${SUPABASE_URL}/rest/v1/products?id=in.(${encodeURIComponent(list)})&select=id,title,price,is_free`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!r.ok) return out;
  const rows = await r.json().catch(() => []);
  for (const p of (Array.isArray(rows) ? rows : [])) out.set(String(p.id), p);
  return out;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
  if (!SERVICE_KEY || !STRIPE_SECRET_KEY) return json({ ok: false, reason: "server_misconfigured" }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, reason: "invalid_json" }, 400); }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems
    .map((it: any) => ({ id: String(it?.id ?? "").trim(), qty: Math.max(1, parseInt(String(it?.qty ?? "1"), 10) || 1) }))
    .filter((it: any) => it.id);
  if (!items.length) return json({ ok: false, reason: "no_items" }, 400);

  const channel = body.channel ? String(body.channel) : "";
  const country = body.country ? String(body.country) : "";
  const fbc = body.fbc ? String(body.fbc) : "";
  const fbp = body.fbp ? String(body.fbp) : "";
  const icEventId = body.ic_event_id ? String(body.ic_event_id).slice(0, 120) : "";
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ua = req.headers.get("user-agent") ?? "";
  const origin = String(body.origin || "https://logramo.com").replace(/\/+$/, "");
  const clientAmounts: Record<string, number> = (body.client_amounts && typeof body.client_amounts === "object") ? body.client_amounts : {};

  // Authoritative product data.
  const products = await fetchProducts(items.map((i: any) => i.id));
  const priced = items.filter((it: any) => {
    const p = products.get(it.id);
    return p && !p.is_free && Number(p.price) > 0;
  });
  if (!priced.length) return json({ ok: false, reason: "no_payable_items" }, 400);

  // Currency + FX (server side, never trusting the client amount).
  let ccy = String(body.currency || "USD").toUpperCase();
  if (!STRIPE_OK.has(ccy)) ccy = "USD";
  let rate = await usdRate(ccy);
  if (!rate) { ccy = "USD"; rate = 1; }
  const lc = ccy.toLowerCase();

  const ids: string[] = [];
  // Per-item price detail for Meta (contents + value), in the charge currency.
  const icContents: { id: string; quantity: number; item_price: number }[] = [];
  let icValue = 0;
  const line_items = priced.map((it: any) => {
    const p = products.get(it.id);
    ids.push(it.id);
    const usd = Number(p.price);
    // Server-computed local major amount (rounded the way the storefront displays it).
    const serverMajor = ZERO_DECIMAL.has(ccy) || DIVISIBLE_100.has(ccy)
      ? Math.round(usd * rate) : Math.round(usd * rate * 100) / 100;
    // Honor the price the buyer actually saw, but only inside a sane band.
    const cAmt = Number(clientAmounts[it.id]);
    let major = serverMajor;
    if (Number.isFinite(cAmt) && cAmt > 0 && cAmt >= serverMajor * 0.7 && cAmt <= serverMajor * 1.5) major = cAmt;
    icContents.push({ id: it.id, quantity: it.qty, item_price: Math.round(major * 100) / 100 });
    icValue += major * it.qty;
    return {
      quantity: it.qty,
      price_data: {
        currency: lc,
        unit_amount: toStripeAmount(major, ccy),
        product_data: { name: String(p.title || "Guía Logramo").slice(0, 250), metadata: { product_id: it.id } },
      },
    };
  });

  const metadata: Record<string, string> = {
    product_ids: ids.join(","), channel: channel.slice(0, 480), country: country.slice(0, 80),
    fbc: fbc.slice(0, 480), fbp: fbp.slice(0, 480),
  };
  const params: any = {
    mode: "payment",
    line_items,
    locale: "es",
    // No payment_method_types / automatic_payment_methods here: for Checkout
    // Sessions, omitting them makes Stripe automatically offer every method
    // enabled in the Dashboard (card, Apple Pay, Google Pay, OXXO, Link, …).
    customer_creation: "always",
    billing_address_collection: "auto",
    metadata,
    payment_intent_data: { metadata },
    success_url: `${origin}/gracias.html?session_id={CHECKOUT_SESSION_ID}&ids=${encodeURIComponent(ids.join(","))}`,
    cancel_url: `${origin}/biblioteca.html`,
  };

  // Server-side InitiateCheckout to Meta (deduped against the browser event by
  // ic_event_id). Kicked off now so its round trip overlaps session creation.
  const icPromise = sendCapiInitiateCheckout({
    eventId: icEventId, value: icValue, currency: ccy, contents: icContents,
    ids, ip, ua, fbc, fbp, sourceUrl: origin,
  });

  // Create the session; if Stripe rejects the currency for this account, retry in USD.
  try {
    let session;
    try {
      session = await stripe.checkout.sessions.create(params);
    } catch (e: any) {
      if (ccy !== "USD") {
        const usdItems = priced.map((it: any) => {
          const p = products.get(it.id);
          return { quantity: it.qty, price_data: { currency: "usd", unit_amount: toStripeAmount(Number(p.price), "USD"), product_data: { name: String(p.title || "Guía Logramo").slice(0, 250), metadata: { product_id: it.id } } } };
        });
        session = await stripe.checkout.sessions.create({ ...params, line_items: usdItems });
      } else { throw e; }
    }
    await icPromise.catch(() => {});
    return json({ ok: true, url: session.url, id: session.id });
  } catch (e: any) {
    return json({ ok: false, reason: "stripe_error", detail: String(e?.message || e) }, 502);
  }
});
