// @ts-nocheck — Deno Edge Function (Supabase)
// Sends the Logramo welcome email when a new row appears in public.subscribers
// (Supabase Database Webhook on INSERT). The same email is sent on account
// signup by send-account-welcome, so this skips the 'account-signup' source.
//
// ENV: RESEND_API_KEY, UNSUB_SECRET, WEBHOOK_SECRET (optional)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { RESEND_API_KEY, FROM, REPLY_TO, smartFirstName, unsubUrl, buildWelcomeHtml } from "../_shared/email.ts";

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";

serve(async (req: Request) => {
  if (req.method === "GET") return new Response("Logramo send-welcome OK", { status: 200 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (WEBHOOK_SECRET) {
    if ((req.headers.get("x-webhook-secret") ?? "") !== WEBHOOK_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }
  }
  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });

  let payload: any;
  try { payload = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid JSON" }), { status: 400 }); }

  const record = payload?.record ?? payload ?? {};
  const email: string = (record.email ?? "").trim();
  const name: string | undefined = record.name ?? undefined;
  const source: string = String(record.source ?? "");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "invalid email" }), { status: 400 });
  }

  // Account signups are welcomed by send-account-welcome — don't double up.
  if (source === "account-signup") {
    return new Response(JSON.stringify({ ok: true, skipped: "account-signup source" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  const firstName = smartFirstName(email, name);
  const unsubscribeUrl = await unsubUrl(email);
  const html = await buildWelcomeHtml({ firstName, unsub: unsubscribeUrl });
  const subject = firstName ? `${firstName}, te damos la bienvenida 🐾` : "Te damos la bienvenida a Logramo 🐾";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [email], subject, html, reply_to: REPLY_TO,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });

  if (!r.ok) {
    const detail = await r.text();
    return new Response(JSON.stringify({ error: "resend failed", detail }), { status: 500 });
  }
  const data = await r.json();
  return new Response(JSON.stringify({ ok: true, id: data?.id, to: email, firstName }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
