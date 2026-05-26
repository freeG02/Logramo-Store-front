// @ts-nocheck — Deno Edge Function (Supabase)
// Handles the tokenized review submission flow.
//
//   GET  /submit-review?token=XYZ
//      → validates the token (exists, not used, not expired)
//      → returns { ok, payerName, productTitle, productId } for prefilling the form,
//        OR { ok:false, reason: "invalid" | "used" | "expired" }
//
//   POST /submit-review
//        body: { token, rating, quote, dogName?, photoDataUrl? }
//      → re-validates the token atomically (marks used_at FIRST to avoid double-submit)
//      → optionally uploads photo (base64 data URL) to storage bucket `media/reviews/...`
//      → inserts a row into `reviews` (status='pending', verified=true)
//      → returns { ok:true }
//
// The function uses the service-role key (auto-injected) so RLS on
// review_tokens / reviews stays locked down for the public anon key.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const BUCKET = "media";
const PHOTO_PREFIX = "reviews";
const MAX_PHOTO_BYTES = 6 * 1024 * 1024; // 6 MB hard cap on the decoded photo

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}
function firstNameFromPayer(name?: string | null): string {
  if (!name || !name.trim()) return "";
  return cap(name.trim().split(/\s+/)[0].slice(0, 20));
}

// ---------- Supabase REST helpers ----------
async function sbSelect(path: string): Promise<any[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) return [];
  return await r.json();
}
async function sbUpdate(table: string, filter: string, patch: any): Promise<Response> {
  return await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });
}
async function sbInsert(table: string, row: any): Promise<Response> {
  return await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
}

// ---------- Token validation (read-only, no side effects) ----------
type TokenInfo =
  | { ok: true; tokenRow: any; purchase: any; productTitle: string }
  | { ok: false; reason: "invalid" | "used" | "expired" };

async function validateToken(token: string): Promise<TokenInfo> {
  if (!token || typeof token !== "string" || token.length < 8) {
    return { ok: false, reason: "invalid" };
  }
  const rows = await sbSelect(`review_tokens?token=eq.${encodeURIComponent(token)}&select=*`);
  const t = rows?.[0];
  if (!t) return { ok: false, reason: "invalid" };
  if (t.used_at) return { ok: false, reason: "used" };
  if (t.expires_at && new Date(t.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  const purchases = await sbSelect(
    `purchases?id=eq.${encodeURIComponent(t.purchase_id)}&select=id,email,payer_name,product_id`
  );
  const purchase = purchases?.[0];
  if (!purchase) return { ok: false, reason: "invalid" };

  let productTitle = "tu guía";
  if (purchase.product_id) {
    const products = await sbSelect(
      `products?id=eq.${encodeURIComponent(purchase.product_id)}&select=title`
    );
    if (products?.[0]?.title) productTitle = products[0].title;
  }
  return { ok: true, tokenRow: t, purchase, productTitle };
}

// ---------- Photo upload (data URL → storage) ----------
function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; mime: string; ext: string } | null {
  // data:image/jpeg;base64,XXX
  const m = /^data:(image\/(jpeg|jpg|png|webp|heic|heif));base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const ext = ({ "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" } as Record<string,string>)[mime] || "jpg";
  try {
    const bin = atob(m[3]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, mime, ext };
  } catch { return null; }
}

async function uploadPhoto(purchaseId: string, dataUrl: string): Promise<string | null> {
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) return null;
  if (decoded.bytes.byteLength > MAX_PHOTO_BYTES) return null;

  const rand = crypto.randomUUID().slice(0, 8);
  const path = `${PHOTO_PREFIX}/${purchaseId}-${rand}.${decoded.ext}`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": decoded.mime,
      "x-upsert": "false",
    },
    body: decoded.bytes,
  });
  if (!r.ok) return null;
  // Public URL — bucket `media` is already public.
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

// ---------- POST handler ----------
async function handlePost(body: any): Promise<Response> {
  const token = String(body?.token ?? "").trim();
  const ratingRaw = Number(body?.rating);
  const quote = String(body?.quote ?? "").trim();
  const dogName = String(body?.dogName ?? "").trim().slice(0, 40);
  const photoDataUrl = typeof body?.photoDataUrl === "string" ? body.photoDataUrl : "";

  if (!token) return json({ ok: false, reason: "invalid" }, 400);
  if (!Number.isFinite(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return json({ ok: false, reason: "bad_rating" }, 400);
  }
  if (quote.length < 10) return json({ ok: false, reason: "quote_too_short" }, 400);
  if (quote.length > 800) return json({ ok: false, reason: "quote_too_long" }, 400);

  const info = await validateToken(token);
  if (!info.ok) return json({ ok: false, reason: info.reason }, 410);

  // Atomic-ish "claim" — mark the token used BEFORE inserting the review.
  // PostgREST UPDATE with `used_at=is.null` filter ensures only one POST wins.
  const claim = await sbUpdate(
    "review_tokens",
    `token=eq.${encodeURIComponent(token)}&used_at=is.null`,
    { used_at: new Date().toISOString() }
  );
  let claimedRows: any[] = [];
  try { claimedRows = await claim.json(); } catch {}
  if (!claim.ok || !Array.isArray(claimedRows) || claimedRows.length === 0) {
    // Another request beat us to it.
    return json({ ok: false, reason: "used" }, 410);
  }

  // Optional photo upload — failure is non-fatal (we just save the review without photo).
  let photoUrl: string | null = null;
  if (photoDataUrl) {
    photoUrl = await uploadPhoto(info.purchase.id, photoDataUrl);
  }

  const reviewRow: any = {
    name: info.purchase.payer_name || firstNameFromPayer(info.purchase.payer_name) || "Cliente verificado",
    quote,
    rating: Math.round(ratingRaw),
    product_id: info.purchase.product_id || null,
    status: "pending",
    verified: true,
    submitted_by: info.purchase.email || null,
  };
  if (dogName) reviewRow.dog_name = dogName;
  if (photoUrl) reviewRow.photo_url = photoUrl;

  const ins = await sbInsert("reviews", reviewRow);
  if (!ins.ok) {
    // Roll the token back so the buyer can try again.
    await sbUpdate("review_tokens", `token=eq.${encodeURIComponent(token)}`, { used_at: null });
    const detail = await ins.text().catch(() => "");
    return json({ ok: false, reason: "insert_failed", detail }, 500);
  }

  return json({ ok: true, photoUploaded: !!photoUrl });
}

// ---------- Entry ----------
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (!SUPABASE_KEY) {
    return json({ ok: false, reason: "server_misconfigured" }, 500);
  }

  const url = new URL(req.url);

  // Health check
  if (req.method === "GET" && url.searchParams.get("health") === "1") {
    return new Response("Logramo submit-review OK", { status: 200, headers: CORS_HEADERS });
  }

  // GET: validate token + return prefill data
  if (req.method === "GET") {
    const token = url.searchParams.get("token") ?? "";
    const info = await validateToken(token);
    if (!info.ok) return json({ ok: false, reason: info.reason }, 200);
    return json({
      ok: true,
      payerName: info.purchase.payer_name || "",
      firstName: firstNameFromPayer(info.purchase.payer_name),
      productTitle: info.productTitle,
      productId: info.purchase.product_id || null,
    });
  }

  // POST: submit the review
  if (req.method === "POST") {
    let body: any;
    try { body = await req.json(); }
    catch { return json({ ok: false, reason: "bad_json" }, 400); }
    return await handlePost(body);
  }

  return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
});
