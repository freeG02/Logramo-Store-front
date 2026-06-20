// @ts-nocheck — Deno Edge Function (Supabase)
// DANGER: wipes operational data back to zero. Used by the dashboard "Danger zone".
//
//   POST /reset-data
//     headers: Authorization: Bearer <admin access token>
//     body:    { confirm: "RESET" }
//   → verifies the bearer token belongs to a profile with is_admin = true
//   → deletes ALL rows from, in FK-safe order:
//        review_tokens → purchases → subscribers → pageviews → cart_events → checkout_events
//   → returns { ok:true, deleted: { review_tokens, purchases, subscribers, pageviews, cart_events, checkout_events } }
//
// What it does NOT touch: products, articles, videos, reviews, messages, blog_*.
//
// Security: the admin's JWT is the boundary (only an is_admin profile can run this).
// The dashboard also re-prompts for the admin password before calling, but that is
// UI friction — the server trusts the verified token, never a password.
//
// Deployed with --no-verify-jwt, so we verify the user token ourselves.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Tables wiped, in dependency order (children before parents).
const RESET_TABLES = ["review_tokens", "purchases", "subscribers", "pageviews", "cart_events", "checkout_events"];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// Verify the caller's access token and confirm they are an admin.
// Returns the user id on success, or null.
async function verifyAdmin(token: string): Promise<string | null> {
  if (!token) return null;
  // 1) Resolve the token to a user.
  const ures = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY || SERVICE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!ures.ok) return null;
  const user = await ures.json().catch(() => null);
  const uid = user?.id;
  if (!uid) return null;
  // 2) Check is_admin on their profile (service role bypasses RLS).
  const pres = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=is_admin`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  );
  if (!pres.ok) return null;
  const rows = await pres.json().catch(() => []);
  return rows?.[0]?.is_admin === true ? uid : null;
}

// Delete every row from a table; return how many were removed.
// `created_at=not.is.null` matches all rows (every target table has created_at)
// and satisfies PostgREST's requirement that DELETE carry a filter.
async function wipeTable(table: string): Promise<number> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?created_at=not.is.null`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "count=exact",
      },
    },
  );
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`${table}: HTTP ${r.status} ${detail}`);
  }
  // Content-Range looks like "*/123" (total affected).
  const cr = r.headers.get("content-range") || "";
  const n = parseInt(cr.split("/")[1] || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ ok: false, reason: "method_not_allowed" }, 405);
  }
  if (!SERVICE_KEY) {
    return json({ ok: false, reason: "server_misconfigured" }, 500);
  }

  // --- Auth: must be an admin ---
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const adminId = await verifyAdmin(token);
  if (!adminId) {
    return json({ ok: false, reason: "not_admin" }, 403);
  }

  // --- Explicit confirmation in the body (defense in depth) ---
  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }
  if (body?.confirm !== "RESET") {
    return json({ ok: false, reason: "not_confirmed" }, 400);
  }

  // --- Wipe ---
  const deleted: Record<string, number> = {};
  try {
    for (const table of RESET_TABLES) {
      deleted[table] = await wipeTable(table);
    }
  } catch (err) {
    return json({ ok: false, reason: "delete_failed", detail: String(err?.message || err), deleted }, 500);
  }

  return json({ ok: true, deleted });
});
