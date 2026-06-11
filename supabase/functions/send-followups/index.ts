// @ts-nocheck — Deno Edge Function (Supabase)
// Daily cron: scans public.purchases and sends time-based follow-up emails.
//   +7d   →  "How's it going?" check-in
//   +14d  →  Review request (with tokenized review link)
//
// Trigger via Supabase Cron (Database → Cron) once per day, or call
// manually via POST. Idempotent: each purchase only gets each email once
// (tracked via purchases.checkin_sent_at and purchases.review_sent_at).
//
// ENV required:
//   RESEND_API_KEY
//   SUPABASE_URL              (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY (auto-injected)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") ?? "https://eopobchvkfvkkrtrzeyu.supabase.co";
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const FROM           = "Logramo <ayuda@logramo.com>";
const REPLY_TO       = "ayuda@logramo.com";
const SITE_URL       = "https://logramo.com";

// ---------- helpers ----------
function cap(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; }
function firstNameFromPayer(name?: string | null): string {
  if (!name || !name.trim()) return "";
  return cap(name.trim().split(/\s+/)[0].slice(0, 20));
}
function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function monthYear(d = new Date()): string {
  const m = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${m[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
}
function randomToken(len = 32): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

// ---------- Supabase REST helpers ----------
async function sbSelect(path: string): Promise<any[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!r.ok) return [];
  return await r.json();
}
async function sbUpdate(table: string, id: string, patch: any): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(patch),
  });
}
async function sbInsert(table: string, row: any): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
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

// Inline Logramo logo SVG (terracotta or golden via the COLOR replacement)
const LOGO_SVG = `<svg width="WW" height="HH" viewBox="0 0 193.55 28.54" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;color:COLOR;fill:currentColor;"><path d="M16.05,24.13c-2.59.2-5.16.38-7.71.55-2.56.17-5.13.34-7.71.49-.11-4.15-.2-8.28-.26-12.38C.29,8.7.17,4.57,0,.39c1.46-.02,2.89-.06,4.31-.13,1.41-.07,2.84-.15,4.27-.26-.24,1.61-.46,3.22-.67,4.84-.21,1.62-.36,3.25-.47,4.88-.09,1.37-.16,2.73-.21,4.09-.05,1.36-.1,2.72-.15,4.09,1.44.04,2.85.06,4.26.06s2.81.02,4.22.07l.49,6.1Z"/><path d="M41.94,12.03v.51c0,.16-.01.33-.03.51-.02.3-.08.8-.16,1.5-.09.7-.21,1.42-.36,2.17-.15.75-.34,1.44-.55,2.07-.22.63-.46,1.03-.72,1.21-.13.09-.57.16-1.32.23s-1.66.13-2.74.2c-1.08.06-2.25.12-3.51.16-1.26.04-2.46.08-3.6.11-1.14.03-2.14.06-3,.08-.86.02-1.43.03-1.71.03h-.67c-.32,0-.65,0-.99-.02-.35-.01-.67-.03-.98-.05-.3-.02-.52-.05-.65-.1-.3-.11-.61-.29-.91-.54-.3-.25-.59-.53-.85-.85-.26-.31-.49-.64-.7-.98-.21-.34-.35-.66-.44-.96-.06-.24-.12-.6-.16-1.09s-.08-1-.1-1.53c-.02-.53-.04-1.05-.05-1.55-.01-.5-.02-.88-.02-1.14,0-.41.01-.98.03-1.71.02-.73.09-1.47.2-2.23.11-.76.27-1.47.47-2.14.21-.66.51-1.13.9-1.39.17-.11.5-.21.98-.29.48-.09,1.04-.16,1.7-.23.65-.06,1.35-.11,2.09-.15.74-.03,1.46-.05,2.17-.07.71-.01,1.36-.02,1.97-.02s1.1.01,1.47.03c.33.02.79.04,1.4.05.61.01,1.29.03,2.04.05.75.02,1.53.06,2.33.11.8.05,1.55.12,2.25.21s1.31.2,1.84.34c.53.14.89.31,1.06.51.28.3.51.76.69,1.37.17.61.31,1.26.41,1.94.1.68.16,1.36.2,2.02.03.66.05,1.2.05,1.61ZM35.03,12.72c0-.26-.01-.57-.03-.91-.02-.35-.05-.7-.1-1.06-.04-.36-.11-.71-.2-1.04-.09-.34-.2-.61-.33-.83-.17-.28-.51-.5-1.01-.65-.5-.15-1.05-.27-1.65-.34-.6-.08-1.19-.12-1.76-.15-.58-.02-1.01-.03-1.29-.03-.15,0-.42,0-.82.02-.39.01-.8.03-1.22.05-.42.02-.82.06-1.19.11-.37.05-.61.11-.72.18-.2.13-.35.33-.46.6-.11.27-.19.57-.24.9-.05.33-.09.65-.1.96-.01.32-.02.57-.02.77s.02.55.05,1.06.08,1.05.13,1.63c.05.58.12,1.1.21,1.58.09.48.2.78.33.91.15.17.44.32.86.42.42.11.88.2,1.37.28.49.08.96.13,1.42.16s.78.05.98.05c.35,0,.76-.01,1.24-.03.48-.02.96-.08,1.45-.16.49-.09.95-.21,1.39-.36.43-.15.78-.36,1.04-.62.15-.15.27-.38.36-.69.09-.3.15-.63.2-.98.04-.35.07-.69.08-1.03.01-.34.02-.6.02-.8Z"/><path d="M66.73,13.4c0,.91,0,1.82-.02,2.72-.01.9-.02,1.81-.02,2.72-.02.48-.03.97-.02,1.47.01.5,0,1-.05,1.5-.07.48-.13.98-.2,1.52s-.17,1.06-.33,1.58c-.15.52-.35,1.01-.6,1.47s-.58.85-.99,1.17c-.11.09-.33.16-.65.23s-.71.13-1.14.2c-.44.06-.9.12-1.4.16-.5.04-.98.08-1.44.11-.46.03-.87.07-1.24.1-.37.03-.63.05-.78.05-1.37.04-2.72.08-4.06.1-1.34.02-2.69.03-4.06.03h-2.09c-.04-.37-.09-.75-.13-1.14-.04-.39-.06-.78-.06-1.17,0-.44-.04-.89-.13-1.35-.09-.47-.19-.93-.29-1.39l2.15.03c.13,0,.49,0,1.09-.02.6-.01,1.3-.02,2.1-.03.8-.01,1.67-.03,2.59-.07.92-.03,1.78-.08,2.56-.15.78-.07,1.45-.14,2.01-.23.55-.09.86-.18.93-.29.17-.28.28-.6.33-.96.04-.36.06-.7.06-1.03,0-.17,0-.35-.02-.54-.01-.18-.03-.36-.05-.54-1.22.09-2.42.16-3.62.23-1.2.07-2.41.1-3.65.1h-1.06c-.42,0-.86-.01-1.3-.03-.45-.02-.88-.05-1.3-.1-.42-.04-.77-.11-1.03-.2-.44-.13-.88-.28-1.32-.44-.45-.16-.86-.36-1.26-.6-.39-.24-.73-.53-1.03-.86-.29-.34-.49-.74-.6-1.22-.07-.24-.1-.5-.11-.78-.01-.28-.02-.54-.02-.78,0-.61.03-1.38.1-2.32.07-.93.18-1.89.34-2.85.16-.97.38-1.88.65-2.74.27-.86.61-1.51,1.03-1.94.24-.26.62-.49,1.16-.69.53-.2,1.14-.36,1.81-.49.67-.13,1.39-.24,2.14-.34.75-.1,1.48-.17,2.2-.21.72-.04,1.37-.08,1.97-.1.6-.02,1.07-.03,1.42-.03,1.22,0,2.44.03,3.65.1l.23-2.09,5.48.81c.02,1.89.04,3.77.05,5.64.01,1.87.02,3.76.02,5.67ZM60.96,12.78c0-.7-.01-1.37-.03-2.04-.02-.66-.05-1.34-.1-2.04-.96-.22-1.91-.39-2.87-.52-.96-.13-1.94-.2-2.94-.2-.17,0-.44.01-.78.03-.35.02-.71.06-1.09.11-.38.05-.73.13-1.06.23s-.55.21-.68.34c-.2.22-.32.47-.36.75-.04.28-.07.57-.07.85,0,.24.03.6.08,1.09s.12.99.21,1.52c.09.52.2,1.01.33,1.47.13.46.26.77.39.95.13.17.29.3.49.39s.41.15.64.18c.23.03.46.05.69.07.23.01.43.02.6.02.43,0,.96-.02,1.58-.05s1.24-.09,1.86-.18,1.2-.21,1.75-.38c.54-.16.96-.39,1.24-.67.04-.02.08-.13.1-.33.02-.2.03-.4.03-.62v-.98Z"/><path d="M89.26,11.19v.75l-6.29.29c.07-.28.1-.61.1-.98,0-.54-.08-.9-.23-1.06-.15-.16-.49-.24-1.01-.24-.74,0-1.56.13-2.45.39-.89.26-1.67.51-2.35.75-.11.96-.2,1.91-.26,2.87-.07.96-.1,1.91-.1,2.87,0,1.07,0,2.13.02,3.18.01,1.05.03,2.11.05,3.18l-5.61.36c-.11-1.39-.22-2.78-.33-4.16-.11-1.38-.21-2.77-.29-4.16-.11-1.85-.25-3.69-.42-5.53-.17-1.84-.35-3.69-.52-5.56,1.24.09,2.47.21,3.7.38,1.23.16,2.46.36,3.7.6l-.16,2.74c.65-.52,1.28-.97,1.88-1.35.6-.38,1.21-.7,1.83-.96.62-.26,1.28-.45,1.97-.57s1.47-.18,2.32-.18c.56,0,1.15.06,1.76.18.61.12,1.13.4,1.57.83.22.24.4.6.55,1.08.15.48.27.98.36,1.52.09.53.15,1.05.18,1.57.03.51.05.92.05,1.22Z"/><path d="M114.05,10.24c0,1.83-.06,3.64-.2,5.45-.13,1.8-.26,3.61-.39,5.41-2.44.22-4.86.4-7.27.55-2.41.15-4.84.23-7.27.23-.22,0-.62,0-1.21-.02-.59-.01-1.21-.03-1.86-.06-.65-.03-1.27-.08-1.86-.13-.59-.05-.98-.14-1.17-.24-.72-.39-1.22-.89-1.5-1.48-.28-.6-.42-1.28-.42-2.04,0-.26.01-.61.03-1.04.02-.43.07-.89.13-1.37.06-.48.15-.92.26-1.34.11-.41.24-.72.39-.91.2-.26.64-.48,1.34-.67.7-.18,1.53-.33,2.5-.44.97-.11,2.01-.2,3.13-.26,1.12-.06,2.19-.11,3.21-.15,1.02-.03,1.93-.05,2.74-.05h1.73c.07-.48.1-.95.1-1.4v-.34c0-.18-.01-.3-.03-.34-.07-.13-.27-.24-.62-.33-.35-.09-.78-.15-1.29-.2-.51-.04-1.07-.08-1.66-.11-.6-.03-1.18-.05-1.74-.05h-2.45c-1.37,0-2.74.03-4.11.08-1.37.05-2.74.1-4.11.15.09-.83.16-1.66.21-2.51.05-.85.06-1.69.02-2.51,1.59-.28,3.18-.48,4.78-.6,1.6-.12,3.21-.18,4.84-.18.59,0,1.23,0,1.92.02.7.01,1.39.03,2.09.07.7.03,1.39.08,2.07.15.68.07,1.32.15,1.91.26.61.11,1.21.31,1.81.59.6.28,1.16.63,1.68,1.04.52.41.98.89,1.37,1.42.39.53.67,1.1.85,1.71.02.07.04.17.05.33.01.15.02.32.02.51v.83ZM106.78,17.9v-4.17c-.63-.02-1.26-.04-1.89-.05-.63-.01-1.26-.02-1.89-.02-.13,0-.5,0-1.09.02-.6.01-1.24.04-1.92.08-.68.04-1.31.1-1.88.16-.57.07-.89.16-.98.29-.11.17-.18.35-.21.54-.03.19-.05.38-.05.57,0,.15.01.36.03.62.02.26.06.53.11.82.05.28.11.54.18.78.06.24.15.41.26.52.09.11.23.19.44.24.21.05.43.1.67.13.24.03.48.05.72.06.24.01.42.02.55.02.52,0,1.08-.02,1.68-.07.6-.04,1.21-.09,1.83-.15s1.22-.12,1.81-.2c.59-.08,1.13-.15,1.63-.21Z"/><path d="M148.36,16.7c0,.91-.02,1.81-.05,2.69-.03.88-.09,1.77-.18,2.66-.91.04-1.79.09-2.63.15-.84.05-1.71.17-2.63.34.26-1.57.39-3.14.39-4.73,0-.28-.02-.77-.07-1.45-.04-.68-.1-1.4-.18-2.15-.08-.75-.17-1.44-.29-2.07-.12-.63-.26-1.04-.41-1.24-.11-.13-.27-.23-.49-.29-.22-.06-.45-.11-.69-.15s-.48-.05-.72-.07c-.24-.01-.44-.02-.59-.02-.26,0-.57.01-.93.03s-.72.06-1.09.11c-.37.05-.72.14-1.06.24-.34.11-.61.24-.83.39-.11.09-.2.32-.28.68-.08.37-.14.82-.18,1.34s-.08,1.09-.11,1.7c-.03.61-.06,1.18-.08,1.71-.02.53-.03,1-.03,1.4v.77c0,1.44.03,2.87.1,4.31-.63.02-1.24.04-1.84.07s-1.21.03-1.84.03h-.26c-.11,0-.22-.01-.33-.03-.13,0-.26-.01-.39-.03v-2.38c0-.67-.01-1.37-.03-2.09-.02-.72-.04-1.35-.07-1.89-.02-.37-.05-.85-.1-1.44-.04-.59-.14-1.16-.29-1.71-.15-.55-.38-1.03-.67-1.44s-.7-.6-1.22-.6c-.24,0-.56.04-.96.11-.4.08-.82.17-1.24.29-.42.12-.81.26-1.17.42-.36.16-.61.33-.77.51-.04.04-.09.29-.15.73-.05.45-.1.99-.15,1.63-.04.64-.09,1.34-.15,2.09-.05.75-.1,1.45-.13,2.1-.03.65-.06,1.21-.1,1.68-.03.47-.05.75-.05.83-.44.04-.88.08-1.32.11-.45.03-.89.05-1.32.05s-.83-.01-1.24-.03c-.41-.02-.82-.05-1.21-.1-.11-2.76-.27-5.49-.47-8.19-.21-2.7-.43-5.42-.67-8.19.61-.07,1.21-.12,1.81-.18s1.2-.08,1.81-.08,1.17.01,1.76.03c.59.02,1.19.04,1.79.07l-.42,2.8c1-.8,1.96-1.4,2.89-1.79.92-.39,2.03-.59,3.31-.59.5,0,.94.06,1.32.18.38.12.73.28,1.04.49.31.21.62.45.93.73.3.28.63.59.98.91.39-.61.84-1.09,1.35-1.45.51-.36,1.06-.64,1.65-.83s1.21-.32,1.86-.38c.65-.05,1.3-.08,1.96-.08.52,0,1.07.02,1.65.05.58.03,1.13.13,1.66.28.53.15,1.02.38,1.45.69.44.3.77.72,1.01,1.24.28.63.51,1.33.69,2.09.17.76.31,1.54.41,2.35.1.8.16,1.6.2,2.38s.05,1.51.05,2.19Z"/><path d="M175.95,12.03v.51c0,.16-.01.33-.03.51-.02.3-.08.8-.16,1.5-.09.7-.21,1.42-.36,2.17-.15.75-.34,1.44-.55,2.07-.22.63-.46,1.03-.72,1.21-.13.09-.57.16-1.32.23s-1.66.13-2.74.2c-1.08.06-2.25.12-3.51.16-1.26.04-2.46.08-3.6.11-1.14.03-2.14.06-3,.08-.86.02-1.43.03-1.71.03h-.67c-.32,0-.65,0-.99-.02-.35-.01-.67-.03-.98-.05-.3-.02-.52-.05-.65-.1-.3-.11-.61-.29-.91-.54-.3-.25-.59-.53-.85-.85-.26-.31-.49-.64-.7-.98-.21-.34-.35-.66-.44-.96-.06-.24-.12-.6-.16-1.09s-.08-1-.1-1.53c-.02-.53-.04-1.05-.05-1.55-.01-.5-.02-.88-.02-1.14,0-.41.01-.98.03-1.71.02-.73.09-1.47.2-2.23.11-.76.27-1.47.47-2.14.21-.66.51-1.13.9-1.39.17-.11.5-.21.98-.29.48-.09,1.04-.16,1.7-.23.65-.06,1.35-.11,2.09-.15.74-.03,1.46-.05,2.17-.07.71-.01,1.36-.02,1.97-.02s1.1.01,1.47.03c.33.02.79.04,1.4.05.61.01,1.29.03,2.04.05.75.02,1.53.06,2.33.11.8.05,1.55.12,2.25.21s1.31.2,1.84.34c.53.14.89.31,1.06.51.28.3.51.76.69,1.37.17.61.31,1.26.41,1.94.1.68.16,1.36.2,2.02.03.66.05,1.2.05,1.61ZM169.04,12.72c0-.26-.01-.57-.03-.91-.02-.35-.05-.7-.1-1.06-.04-.36-.11-.71-.2-1.04-.09-.34-.2-.61-.33-.83-.17-.28-.51-.5-1.01-.65-.5-.15-1.05-.27-1.65-.34-.6-.08-1.19-.12-1.76-.15-.58-.02-1.01-.03-1.29-.03-.15,0-.42,0-.82.02-.39.01-.8.03-1.22.05-.42.02-.82.06-1.19.11-.37.05-.61.11-.72.18-.2.13-.35.33-.46.6-.11.27-.19.57-.24.9-.05.33-.09.65-.1.96-.01.32-.02.57-.02.77s.02.55.05,1.06.08,1.05.13,1.63c.05.58.12,1.1.21,1.58.09.48.2.78.33.91.15.17.44.32.86.42.42.11.88.2,1.37.28.49.08.96.13,1.42.16s.78.05.98.05c.35,0,.76-.01,1.24-.03.48-.02.96-.08,1.45-.16.49-.09.95-.21,1.39-.36.43-.15.78-.36,1.04-.62.15-.15.27-.38.36-.69.09-.3.15-.63.2-.98.04-.35.07-.69.08-1.03.01-.34.02-.6.02-.8Z"/><path d="M185.52,5.61v.58l-1.61.08c-.02.32-.04.64-.05.96-.01.32-.02.63-.02.95,0,.39,0,.78-.03,1.16-.02.39-.04.77-.07,1.16-.2.01-.4.02-.6.03s-.4.01-.6.01c-.07,0-.14,0-.21,0s-.14,0-.2,0c.01-.34.02-.68.03-1.01,0-.34.01-.67.01-1.01s0-.67-.02-1.01c-.02-.34-.04-.67-.06-1.01-.16,0-.32.01-.49.02-.16,0-.33,0-.5,0h-.28c-.09,0-.18,0-.28,0-.02-.41-.03-.82-.03-1.23,0-.41-.01-.81-.02-1.22.84.02,1.66.04,2.49.07s1.65.06,2.48.08c.02.24.04.47.05.7.01.23.02.45.02.69Z"/><path d="M193.55,10.61c-.11,0-.21-.01-.31-.02-.08-.01-.17-.02-.25-.02s-.14,0-.18,0c-.22,0-.43,0-.65.01-.22,0-.43.02-.64.05,0-.23,0-.46.01-.69,0-.23,0-.45,0-.69,0-.42,0-.83-.02-1.24-.01-.41-.03-.82-.04-1.24l-1.75,3.96c-.26-.7-.53-1.38-.82-2.05-.29-.67-.6-1.34-.91-2.01l.13,4.12c-.06,0-.12,0-.19,0-.06,0-.13,0-.2,0-.21,0-.42,0-.62.02s-.41.03-.61.05c.03-.52.06-1.03.08-1.54s.04-1.03.04-1.54c0-.61,0-1.21-.01-1.81s-.02-1.2-.02-1.81c.4,0,.79-.01,1.17-.03.38-.02.77-.05,1.17-.09.13.45.27.89.41,1.32s.29.87.45,1.31c.17-.41.37-.82.59-1.21s.44-.79.67-1.18c.38-.01.75-.02,1.12-.03.37-.01.74-.02,1.12-.02.02.5.04,1,.06,1.49s.05.98.07,1.49c.02.4.03.79.05,1.19s.03.79.04,1.18l.02.7v.38Z"/></svg>`;

function logo(width: number, height: number, color: string): string {
  return LOGO_SVG.replace("WW", String(width)).replace("HH", String(height)).replace("COLOR", color);
}

// ============================================================
// CHECK-IN EMAIL (+7 days)
// ============================================================
function buildCheckinHtml(opts: { firstName: string; productTitle: string }): string {
  const heroLine = opts.firstName
    ? `${esc(opts.firstName)},<br>¿cómo va<br><span style="color:#C55932;font-style:italic;">todo?</span>`
    : `¿Cómo va<br><span style="color:#C55932;font-style:italic;">todo?</span>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>¿Cómo va todo? · Logramo</title></head>
<body style="margin:0;padding:0;background:#d6d4c8;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:600px;max-width:100%;background:#FEFAE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111A17;">
  <tr><td style="padding:24px 32px 18px;border-bottom:1px solid rgba(17,26,23,.12);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="left" valign="middle">${logo(130, 20, "#C55932")}</td>
      <td align="right" valign="middle" style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#3C4824;">A los 7 días · ${monthYear()}</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:54px 32px 44px;">
    <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C55932;margin-bottom:18px;">Pasaron 7 días</div>
    <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:60px;line-height:.92;letter-spacing:-.035em;text-transform:uppercase;color:#111A17;">${heroLine}</h1>
    <p style="margin:28px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.5;color:#3C4824;">
      Solo quería escribirte. Pasó una semana desde que descargaste <strong>${esc(opts.productTitle)}</strong> — ¿pudiste empezar? ¿Algo está funcionando? ¿Algo te tiene un poco frustrado?
    </p>
    <p style="margin:18px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.5;color:#3C4824;">
      Si tienes alguna duda o quieres contarnos cómo va, <strong>responde a este email</strong>. Estamos del otro lado.
    </p>
  </td></tr>

  <tr><td style="background:#3C4824;padding:40px 32px;color:#FEFAE8;text-align:center;">
    <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#F6D055;margin-bottom:14px;">Recordatorio amistoso</div>
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.55;color:rgba(254,250,232,.9);">Los resultados no llegan en un día. Si llevaste 2 lecciones a la práctica esta semana, ya vas mejor que el 80% de la gente. Sigue así, sin presión.</p>
  </td></tr>

  <tr><td style="background:#ADCBEF;padding:34px 32px;text-align:center;border-top:2px solid #111A17;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
      <tr>
        <td style="padding:0 10px;"><a href="https://www.facebook.com/profile.php?id=61590239832119" style="text-decoration:none;display:inline-block;"><img src="https://cdn.simpleicons.org/facebook/111A17" alt="Facebook" width="26" height="26" style="display:block;border:0;"></a></td>
        <td style="padding:0 10px;"><a href="https://youtube.com/@megusta_logramo" style="text-decoration:none;display:inline-block;"><img src="https://cdn.simpleicons.org/youtube/111A17" alt="YouTube" width="26" height="26" style="display:block;border:0;"></a></td>
        <td style="padding:0 10px;"><a href="https://pin.it/4WgVTqM4j" style="text-decoration:none;display:inline-block;"><img src="https://cdn.simpleicons.org/pinterest/111A17" alt="Pinterest" width="26" height="26" style="display:block;border:0;"></a></td>
      </tr>
    </table>
    <div style="margin-bottom:10px;line-height:0;">${logo(110, 16, "#C55932")}</div>
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#3C4824;">
      ¿Algo que decirnos? <a href="mailto:ayuda@logramo.com" style="color:#C55932;text-decoration:underline;">Escríbenos a ayuda@logramo.com</a>
    </div>
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(60,72,36,.55);margin-top:14px;">© Logramo · Hecho para perros y los humanos que los adoran</div>
  </td></tr>
</table>
</body></html>`;
}

// ============================================================
// REVIEW REQUEST EMAIL (+14 days)
// ============================================================
function buildReviewHtml(opts: { firstName: string; productTitle: string; reviewUrl: string }): string {
  const heroLine = opts.firstName
    ? `${esc(opts.firstName)},<br>¿nos cuentas<br>cómo te <span style="color:#C55932;font-style:italic;">fue?</span>`
    : `¿Nos cuentas<br>cómo te <span style="color:#C55932;font-style:italic;">fue?</span>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>¿Cómo te fue? · Logramo</title></head>
<body style="margin:0;padding:0;background:#d6d4c8;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:600px;max-width:100%;background:#FEFAE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111A17;">
  <tr><td style="padding:24px 32px 18px;border-bottom:1px solid rgba(17,26,23,.12);">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="left" valign="middle">${logo(130, 20, "#C55932")}</td>
      <td align="right" valign="middle" style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#3C4824;">Reseña · ${monthYear()}</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:54px 32px 44px;">
    <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C55932;margin-bottom:18px;">Tu voz importa</div>
    <h1 style="margin:0;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:56px;line-height:.92;letter-spacing:-.035em;text-transform:uppercase;color:#111A17;">${heroLine}</h1>
    <p style="margin:28px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.5;color:#3C4824;">
      Hace dos semanas descargaste <strong>${esc(opts.productTitle)}</strong>. Si te ayudó (o si no), nos haría un montón saber lo que piensas. 30 segundos, sin compromiso — y le sirve a otros dueños como tú que están decidiendo si vale la pena.
    </p>
  </td></tr>

  <tr><td style="background:#3C4824;padding:48px 32px;color:#FEFAE8;text-align:center;">
    <div style="font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#F6D055;margin-bottom:14px;">Tu reseña</div>
    <h2 style="margin:0 0 22px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:30px;line-height:1.05;letter-spacing:-.02em;text-transform:uppercase;color:#FEFAE8;">¿Te ayudó la guía?</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
      <td style="background:#F6D055;border:2px solid #111A17;border-radius:12px;box-shadow:4px 4px 0 #111A17;">
        <a href="${esc(opts.reviewUrl)}" style="display:inline-block;padding:14px 26px;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#111A17;text-decoration:none;">Dejar mi reseña &nbsp;→</a>
      </td>
    </tr></table>
    <p style="margin:18px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:rgba(254,250,232,.55);">El enlace es único y solo tuyo · Lleva 30 segundos.</p>
  </td></tr>

  <tr><td style="background:#F8F3D9;padding:32px 32px;">
    <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.55;color:#3C4824;text-align:center;">
      ¿Prefieres contarnos por aquí? También nos sirve. <a href="mailto:ayuda@logramo.com?subject=Mi%20experiencia%20con%20${encodeURIComponent(opts.productTitle)}" style="color:#C55932;text-decoration:underline;">Respondé a este email</a> con dos líneas.
    </p>
  </td></tr>

  <tr><td style="background:#ADCBEF;padding:34px 32px;text-align:center;border-top:2px solid #111A17;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 20px;">
      <tr>
        <td style="padding:0 10px;"><a href="https://www.facebook.com/profile.php?id=61590239832119" style="text-decoration:none;display:inline-block;"><img src="https://cdn.simpleicons.org/facebook/111A17" alt="Facebook" width="26" height="26" style="display:block;border:0;"></a></td>
        <td style="padding:0 10px;"><a href="https://youtube.com/@megusta_logramo" style="text-decoration:none;display:inline-block;"><img src="https://cdn.simpleicons.org/youtube/111A17" alt="YouTube" width="26" height="26" style="display:block;border:0;"></a></td>
        <td style="padding:0 10px;"><a href="https://pin.it/4WgVTqM4j" style="text-decoration:none;display:inline-block;"><img src="https://cdn.simpleicons.org/pinterest/111A17" alt="Pinterest" width="26" height="26" style="display:block;border:0;"></a></td>
      </tr>
    </table>
    <div style="margin-bottom:10px;line-height:0;">${logo(110, 16, "#C55932")}</div>
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#3C4824;">Logramo · perros felices, dueños imperfectos</div>
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(60,72,36,.55);margin-top:14px;">© Logramo · ¿Algún problema? <a href="mailto:ayuda@logramo.com" style="color:#C55932;text-decoration:underline;">ayuda@logramo.com</a></div>
  </td></tr>
</table>
</body></html>`;
}

// ============================================================
// Send via Resend
// ============================================================
async function resendSend(to: string, subject: string, html: string): Promise<{ok: boolean; id?: string; error?: string}> {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, reply_to: REPLY_TO }),
  });
  if (!r.ok) {
    const detail = await r.text();
    return { ok: false, error: detail };
  }
  const data = await r.json();
  return { ok: true, id: data?.id };
}

// ============================================================
// Main runner
// ============================================================
async function runFollowups(opts: { dryRun?: boolean } = {}): Promise<any> {
  const summary = {
    checkin_candidates: 0,
    checkin_sent: 0,
    checkin_failed: 0,
    review_candidates: 0,
    review_sent: 0,
    review_failed: 0,
    dryRun: !!opts.dryRun,
    errors: [] as string[],
  };

  // 7-day check-ins
  const checkinList = await sbSelect(
    `purchases?select=*&created_at=lt.${new Date(Date.now() - 7*864e5).toISOString()}&checkin_sent_at=is.null`
  );
  summary.checkin_candidates = checkinList.length;

  for (const p of checkinList) {
    const product = p.product_id ? await sbSelect(`products?id=eq.${p.product_id}&select=title`) : [];
    const productTitle = product?.[0]?.title ?? "tu guía";
    const firstName = firstNameFromPayer(p.payer_name);
    const html = buildCheckinHtml({ firstName, productTitle });
    const subject = firstName ? `${firstName}, ¿cómo va todo con tu perro?` : `¿Cómo va todo con tu perro?`;

    if (opts.dryRun) { summary.checkin_sent++; continue; }

    const r = await resendSend(p.email, subject, html);
    if (r.ok) {
      await sbUpdate("purchases", p.id, { checkin_sent_at: new Date().toISOString() });
      summary.checkin_sent++;
    } else {
      summary.checkin_failed++;
      summary.errors.push(`checkin ${p.id}: ${r.error}`);
    }
  }

  // 14-day review requests
  const reviewList = await sbSelect(
    `purchases?select=*&created_at=lt.${new Date(Date.now() - 14*864e5).toISOString()}&review_sent_at=is.null`
  );
  summary.review_candidates = reviewList.length;

  for (const p of reviewList) {
    const product = p.product_id ? await sbSelect(`products?id=eq.${p.product_id}&select=title`) : [];
    const productTitle = product?.[0]?.title ?? "tu guía";
    const firstName = firstNameFromPayer(p.payer_name);

    // Generate review token
    const token = randomToken(32);
    await sbInsert("review_tokens", { token, purchase_id: p.id });
    const reviewUrl = `${SITE_URL}/review.html?token=${token}`;

    const html = buildReviewHtml({ firstName, productTitle, reviewUrl });
    const subject = firstName ? `${firstName}, ¿nos cuentas cómo te fue?` : `¿Nos cuentas cómo te fue?`;

    if (opts.dryRun) { summary.review_sent++; continue; }

    const r = await resendSend(p.email, subject, html);
    if (r.ok) {
      await sbUpdate("purchases", p.id, { review_sent_at: new Date().toISOString() });
      summary.review_sent++;
    } else {
      summary.review_failed++;
      summary.errors.push(`review ${p.id}: ${r.error}`);
    }
  }

  return summary;
}

serve(async (req: Request) => {
  if (req.method === "GET" && req.url.endsWith("/health")) {
    return new Response("Logramo send-followups OK", { status: 200 });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });
  }

  // Manual trigger / dry run support
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  // Preview: send a sample check-in + review to a single address, no DB scan.
  const testTo = url.searchParams.get("testTo");
  if (testTo) {
    const fn = "Gerby";
    const productTitle = "Cría un Perro Feliz";
    const c = await resendSend(testTo, `${fn}, ¿cómo va todo con tu perro?`, buildCheckinHtml({ firstName: fn, productTitle }));
    const v = await resendSend(testTo, `${fn}, ¿nos cuentas cómo te fue?`, buildReviewHtml({ firstName: fn, productTitle, reviewUrl: `${SITE_URL}/review.html?token=preview` }));
    return new Response(JSON.stringify({ preview: true, to: testTo, checkin_sent: c.ok, review_sent: v.ok }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const summary = await runFollowups({ dryRun });
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
