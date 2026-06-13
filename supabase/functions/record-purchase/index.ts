// @ts-nocheck — Deno Edge Function (Supabase)
// Server-verified purchase recording. The browser POSTs only the PayPal order
// id (plus attribution); this function INDEPENDENTLY verifies the order with
// PayPal's API, then inserts the row with the service role (bypassing RLS).
// This lets us drop the public INSERT policy so nobody can POST fake orders.
//
//   POST /record-purchase
//     body: { order_id, channel?, country? }
//   → verifies the order is COMPLETED with PayPal, dedupes by order id,
//     inserts into public.purchases (which fires the confirmation email).
//
// Trust model: email / payer name / amount / currency / product_id all come
// from PayPal's verified response, NOT from the client. product_id is read from
// the order's custom_id (set in partials.js createOrder).
//
// ENV required:
//   PAYPAL_CLIENT_SECRET        (Supabase secret — NEVER commit this)
//   SUPABASE_URL                (auto)
//   SUPABASE_SERVICE_ROLE_KEY   (auto)
// PayPal client id + env are read from public.site_settings (paypal_client_id,
// paypal_env), the same source the storefront uses.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Max-Age": "86400",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });
}

async function getSetting(key: string): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?key=eq.${encodeURIComponent(key)}&select=value`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!r.ok) return "";
  const rows = await r.json().catch(() => []);
  return rows?.[0]?.value ?? "";
}

// Returns the product ids already recorded for this order, so re-running this
// function (PayPal retry, double webhook) never double-inserts or double-emails.
// A single-product order with no product_id records the empty-string key.
async function recordedProductIds(orderId: string): Promise<Set<string>> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/purchases?paypal_order_id=eq.${encodeURIComponent(orderId)}&select=product_id`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!r.ok) return new Set();
  const rows = await r.json().catch(() => []);
  return new Set((Array.isArray(rows) ? rows : []).map((x: any) => String(x?.product_id ?? "")));
}

async function paypalToken(base: string, clientId: string): Promise<string> {
  const auth = btoa(`${clientId}:${PAYPAL_CLIENT_SECRET}`);
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`paypal auth failed: ${r.status}`);
  return (await r.json()).access_token;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
  if (!SERVICE_KEY) return json({ ok: false, reason: "server_misconfigured" }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, reason: "invalid_json" }, 400); }

  const orderId = String(body.order_id ?? "").trim();
  const channel = body.channel ? String(body.channel) : null;
  const country = body.country ? String(body.country) : null;
  if (!orderId) return json({ ok: false, reason: "missing_order_id" }, 400);

  // Which products from this order are already on file (idempotency, per item).
  const already = await recordedProductIds(orderId);

  // PayPal config (client id + env from site_settings, secret from env).
  const clientId = await getSetting("paypal_client_id");
  const env = (await getSetting("paypal_env")) || "live";
  const base = env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  if (!clientId || !PAYPAL_CLIENT_SECRET) return json({ ok: false, reason: "paypal_not_configured" }, 500);

  // Verify the order with PayPal.
  let order: any;
  try {
    const token = await paypalToken(base, clientId);
    const r = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!r.ok) return json({ ok: false, reason: "order_not_found", status: r.status }, 400);
    order = await r.json();
  } catch (e) {
    return json({ ok: false, reason: "paypal_error", detail: String(e?.message || e) }, 502);
  }

  // Must be a completed payment.
  const pu = (order?.purchase_units && order.purchase_units[0]) || {};
  const captureStatus = pu?.payments?.captures?.[0]?.status;
  if (order?.status !== "COMPLETED" && captureStatus !== "COMPLETED") {
    return json({ ok: false, reason: "not_completed", status: order?.status, capture: captureStatus }, 400);
  }

  // Everything below is from PayPal's verified response, not the client.
  const currency = pu?.amount?.currency_code ?? pu?.payments?.captures?.[0]?.amount?.currency_code ?? "USD";
  const payer = order?.payer ?? {};
  const email = (payer?.email_address ?? "").trim();
  const name = [payer?.name?.given_name, payer?.name?.surname].filter(Boolean).join(" ").trim() || null;

  if (!email) return json({ ok: false, reason: "no_payer_email" }, 400);

  // Build the list of (product_id, amount) to record. A cart order carries
  // line items (sku = product id, set in script.js buildCartOrder); a single
  // product page order carries none, so fall back to the order's custom_id +
  // total. Either way the figures come from PayPal's verified response.
  const items = Array.isArray(pu?.items) ? pu.items : [];
  let lines: { productId: string | null; amount: number }[] = [];
  if (items.length) {
    lines = items.map((it: any) => {
      const sku = String(it?.sku ?? "").trim();
      const unit = Number(it?.unit_amount?.value ?? 0);
      const qty = Math.max(1, parseInt(String(it?.quantity ?? "1"), 10) || 1);
      return { productId: sku || null, amount: Math.round(unit * qty * 100) / 100 };
    });
  } else {
    const amount = Number(pu?.amount?.value ?? pu?.payments?.captures?.[0]?.amount?.value ?? 0);
    lines = [{ productId: (pu?.custom_id ?? "").trim() || null, amount }];
  }

  // Insert one row per not-yet-recorded product. Each insert fires its own
  // confirmation email + PDF via the purchases INSERT trigger.
  const recorded: string[] = [];
  const skipped: string[] = [];
  const failed: { product: string | null; detail: string }[] = [];
  const emailItems: { product_id: string | null; amount: number }[] = [];
  for (const line of lines) {
    if (already.has(String(line.productId ?? ""))) { skipped.push(line.productId ?? ""); continue; }
    const row: any = {
      email, payer_name: name, product_id: line.productId,
      amount: line.amount, currency, paypal_order_id: orderId, status: "completed",
      channel, country,
    };
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (ins.ok) {
      recorded.push(line.productId ?? "");
      already.add(String(line.productId ?? ""));
      emailItems.push({ product_id: line.productId, amount: line.amount });
    } else {
      failed.push({ product: line.productId, detail: await ins.text().catch(() => "") });
    }
  }

  if (failed.length && !recorded.length && !skipped.length) {
    return json({ ok: false, reason: "insert_failed", failed }, 500);
  }

  // ONE confirmation email for the whole order (a link per guide). Sent here
  // rather than from a per-row DB trigger, so a cart of N guides = 1 email,
  // not N. Fire-and-forget: a slow/failed email must never fail the purchase.
  let emailed = false;
  if (emailItems.length) {
    try {
      const er = await fetch(`${SUPABASE_URL}/functions/v1/send-purchase`, {
        method: "POST",
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ order: { email, payer_name: name, currency, paypal_order_id: orderId, items: emailItems } }),
      });
      emailed = er.ok;
    } catch (_e) { /* swallow — purchase is already recorded */ }
  }

  return json({ ok: true, recorded, skipped, failed, emailed, currency });
});
