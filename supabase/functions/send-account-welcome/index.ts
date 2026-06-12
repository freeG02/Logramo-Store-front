// @ts-nocheck — Deno Edge Function (Supabase)
// Sends the Logramo WELCOME email when a customer creates an account.
// Triggered by AFTER INSERT on public.profiles (profiles_welcome_insert pg_net
// trigger). Uses the same welcome template as send-welcome — there is no longer
// a separate "tu cuenta está lista" email.
//
// ENV: RESEND_API_KEY, UNSUB_SECRET

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { RESEND_API_KEY, FROM, REPLY_TO, smartFirstName, unsubUrl, buildWelcomeHtml } from "../_shared/email.ts";

serve(async (req: Request) => {
  if (req.method === "GET") return new Response("Logramo send-account-welcome OK", { status: 200 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });

  let payload: any;
  try { payload = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid JSON" }), { status: 400 }); }

  const r = payload?.record ?? payload ?? {};
  const email: string = String(r.email ?? "").trim();
  const username: string = String(r.username ?? r.name ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "bad email" }), { status: 400 });
  }

  const firstName = smartFirstName(email, username);
  const unsubscribeUrl = await unsubUrl(email);
  const html = await buildWelcomeHtml({ firstName, unsub: unsubscribeUrl });
  const subject = firstName ? `${firstName}, te damos la bienvenida 🐾` : "Te damos la bienvenida a Logramo 🐾";

  const r2 = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM, to: [email], subject, html, reply_to: REPLY_TO,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  if (!r2.ok) {
    const detail = await r2.text();
    return new Response(JSON.stringify({ error: "resend failed", detail }), { status: 500 });
  }
  const data = await r2.json();
  return new Response(JSON.stringify({ ok: true, id: data?.id }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
