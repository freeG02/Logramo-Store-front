// @ts-nocheck — Deno Edge Function (Supabase)
// Read-only Checkout Session status for gracias.html. Lets the thank-you page
// tell an instant payment (card → download now) apart from an async one
// (OXXO → "te llega por email"), and gives it the real amount + session id to
// fire the browser Purchase pixel (deduped against the webhook's CAPI event).
//
//   POST /checkout-status  { session_id }
//   → { ok, paid, pending, email, currency, amount, ids:[...] }
//
// ENV required: STRIPE_SECRET_KEY

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-06-20",
});

const ZERO_DECIMAL = new Set(["BIF","CLP","DJF","GNF","JPY","KMF","KRW","MGA","PYG","RWF","UGX","VND","VUV","XAF","XOF","XPF"]);
function fromStripeAmount(amount: number, ccy: string): number {
  const c = String(ccy || "").toUpperCase();
  if (ZERO_DECIMAL.has(c)) return Math.round(Number(amount) || 0);
  return Math.round((Number(amount) || 0)) / 100;
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
  if (!STRIPE_SECRET_KEY) return json({ ok: false, reason: "server_misconfigured" }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, reason: "invalid_json" }, 400); }
  const sessionId = String(body.session_id || "").trim();
  if (!sessionId) return json({ ok: false, reason: "missing_session_id" }, 400);

  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    const currency = String(s.currency || "usd").toUpperCase();
    const ids = String(s.metadata?.product_ids || "").split(",").map((x: string) => x.trim()).filter(Boolean);
    const paid = s.payment_status === "paid";
    // Still-open async method (chiefly OXXO): a voucher the buyer hasn't paid yet.
    const pending = s.payment_status === "unpaid" && s.status !== "expired";
    // Per-line price detail (charge currency) so the thank-you page's Purchase
    // pixel can send `contents` with a real item_price per guide — matches the
    // CAPI event's contents and gives Meta varied price info.
    let items: { id: string; qty: number; amount: number }[] = [];
    if (paid) {
      try {
        const li = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ["data.price.product"] });
        items = (li.data || []).map((it: any) => {
          const prod = it?.price?.product;
          const pid = (prod && typeof prod === "object" && prod.metadata && prod.metadata.product_id) ? String(prod.metadata.product_id) : "";
          const qty = Math.max(1, Number(it.quantity) || 1);
          return { id: pid, qty, amount: Math.round((fromStripeAmount(it.amount_total, currency) / qty) * 100) / 100 };
        }).filter((x: any) => x.id);
      } catch (_e) { /* fall back to ids-only below */ }
    }
    return json({
      ok: true, paid, pending,
      email: s.customer_details?.email || "",
      currency, amount: fromStripeAmount(s.amount_total, currency), ids, items,
    });
  } catch (e: any) {
    return json({ ok: false, reason: "stripe_error", detail: String(e?.message || e) }, 502);
  }
});
