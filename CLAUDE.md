# Logramo — Project Context

This file is auto-read by Claude Code at the start of every conversation in this project. It captures everything a fresh assistant needs to know to continue working seamlessly.

---

## What is Logramo?

A Spanish-language dog-care brand selling **digital guides** (PDFs) to dog owners across Latin America + Spain. Customer-facing site at **logramo.com**. Hosted on **GitHub Pages** (`freeG02/Logramo-Store-front` → `main` branch). Custom domain via GoDaddy.

**Backend**: Supabase (project ref `eopobchvkfvkkrtrzeyu`). Postgres + Storage + Auth + Edge Functions.

**Payments**: PayPal Smart Buttons (currently in **LIVE** mode). Client ID stored in `public.site_settings` table (key `paypal_client_id`).

**Emails**: Resend transactional API, invoked from Supabase Edge Functions. Sending from `ayuda@logramo.com` (domain verified, DNS records in GoDaddy: DKIM + SPF + feedback MX).

---

## Brand voice (CRITICAL — never violate)

- **Spanish, Latin American neutral** (no overly Spain-only slang).
- **Friend who's been there**, not a manual or a brand voice. ~65% emotional / 35% problem-solving.
- Warm, honest, light humor. Acknowledge the chaos of owning a dog before giving advice.
- **NEVER** say things like "real person, not a bot" / "persona real, no un robot" / "no es un bot" / "human team" — these phrases are forbidden site-wide and in all emails.
- Use "tú" form, not "usted". Latin-neutral phrasing.

---

## Visual system (neo-brutalist)

**Fonts**
- Body: Inter (Google Fonts via `@import`).
- Display/headings: HelveticaNeue + HelveticaCond (loaded via `@font-face` from `/fonts/`).
- In emails: fall back to `Arial Black` for headlines (email clients don't load custom fonts reliably).

**Colors** (CSS vars in `styles.css`)
- `--c-cream: #FEFAE8` (main bg)
- `--c-cream-alt: #F8F3D9` (soft contrast bg)
- `--c-ink: #111A17` (text, borders)
- `--c-terracotta: #C55932` (primary accent)
- `--c-golden: #F6D055` (CTA, highlights)
- `--c-forest: #3C4824` (dark green sections)
- `--c-sky: #ADCBEF` (footer of emails, accent)
- `--c-peach: #FFCDB8`
- `--c-sage: #B5C1AB`

**Signature design tokens**
- Hard shadows: `4px 4px 0 var(--c-ink)` (no soft shadows).
- 2px ink borders on cards/buttons.
- Hover: `translate(-2px,-2px)` + bigger shadow.
- Rounded corners: `var(--radius-md)` / `var(--radius-lg)`.
- Hero typography: HUGE uppercase, tight tracking, italic accent words in terracotta.

---

## Repo & deploy

- **Local checkout**: `C:\Users\rosem\OneDrive\Documents\Logramo\Logo Assets\Website Assets\`
- **Worktree (where Claude edits)**: `.claude\worktrees\eager-goldwasser-174752\`
- **Live URL**: https://logramo.com (deployed via GitHub Pages, `CNAME` + `.nojekyll`).
- **Push to live**: `git add -A && git commit -m "..." && git push` (from worktree).
  - **User's policy**: DO NOT push live unless explicitly asked. They say "push it live" when they want it.
- **Local preview server**: `localhost:8099` (Claude Preview MCP, `preview-start name: logramo-site`).

**Supabase CLI**
- Linked from `Website Assets\` (project root), not from the worktree.
- Project ref: `eopobchvkfvkkrtrzeyu`.
- The deploy folder is `Website Assets\supabase\functions\<name>\index.ts`.
- Claude edits in the worktree; user runs `Copy-Item` (or Claude can via PowerShell tool) to mirror into the deploy folder before deploying.
- Deploy: `supabase functions deploy <name> --use-api --no-verify-jwt`.
- `--no-verify-jwt` because the project uses the new `sb_publishable_...` keys which don't pass legacy JWT verification.

---

## Database schema

**products** — guides for sale. Columns include: `id (uuid)`, `title`, `category`, `description`, `price`, `original_price`, `is_free`, `tags (text[])`, `cover_color`, `cover_icon`, `cover_sub`, `cover_title`, `cover_image`, `images (jsonb)`, `pdf_url`, `buy_url` (unused, legacy), `problems (jsonb)`, `solutions (jsonb)`, `modules (jsonb)`, `audience (jsonb)`, `published`, `featured`, `pinned`, `sort_order`, `created_at`.

**articles** — blog posts. Similar shape: `title`, `category`, `excerpt`, `read_time`, `image_url`, `hot`, `tags`, `pinned`, `sort_order`, `published`, `created_at`.

**videos** — homepage video cards. `title`, `label`, `youtube_url`, `thumbnail`, `pinned`, `sort_order`, `created_at`.

**reviews** — customer testimonials. `name`, `location`, `quote`, `rating`, `avatar`, `dog_name`, `photo_url`, `product_id` (nullable, links to products), `status` (`pending`/`approved`/`rejected`), `verified` (bool — true if submitted via tokenized link from purchase), `submitted_by`, `pinned`, `sort_order`, `created_at`.

**subscribers** — newsletter signups. `email`, `source`, `created_at`. Trigger sends welcome email on insert.

**purchases** — every successful PayPal capture lands here. `email`, `payer_name`, `product_id`, `amount`, `currency`, `paypal_order_id`, `status`, `channel`, `country`, `checkin_sent_at`, `review_sent_at`, `created_at`. A **cart order writes one row per guide, all sharing the same `paypal_order_id`** (the `record-purchase` function reads PayPal's verified line items). The confirmation email is sent **once per order by `record-purchase`** (NOT by a DB trigger — that was dropped in `20260622`). The daily cron picks up rows that are +7d (sends check-in) and +14d (sends review request) — note these are still per-row, so a multi-guide order gets a check-in/review request per guide.

**review_tokens** — one-use tokens for tokenized review links sent in email. `token (pk)`, `purchase_id (fk)`, `used_at`, `expires_at` (default +90 days), `created_at`.

**site_settings** — key/value config. Currently holds: `paypal_client_id`, `paypal_env` (`live`), `highlight_product_id` (which product appears in the homepage highlight block).

---

## Pages on the public site

| Page | What it does |
|---|---|
| `index.html` | Homepage — hero with rotating image, "highlight" paid product block (Cría un Perro Feliz right now), latest 3 blog posts, 3 homepage videos, reviews carousel, newsletter signup. |
| `biblioteca.html` | Product library. Filter chips that auto-hide if empty. Featured carousel (Destacados, max 2 cards, fully clickable). |
| `blog.html` | Article list. Multi-select category filter chips that auto-hide if empty. |
| `producto.html?id=...` | Product detail page. 2×2 image grid where each tile holds an A4-portrait paper-shaped wrapper. Clickable images open a lightbox with prev/next arrow nav. PayPal Smart Buttons (Card on top, PayPal below, brand-styled wrapper). |
| `gracias.html?id=...&order=...` | Post-purchase thank-you page. Confetti animation. Auto-downloads PDF. Cart orders land here as `?ids=a,b,c&order=...` — it lists every guide and auto-downloads each PDF; single `?id=` still works. |
| **Cart sidebar** (`partials.js`) | Real multi-item PayPal checkout: "Ir al pago" swaps to PayPal Smart Buttons in the footer, builds ONE order with an `items[]` breakdown (single capture = one fee), captures, calls `record-purchase`, then → `gracias.html?ids=...`. `script.js` → `checkout()` / `buildCartOrder()`. |
| `invoice.html?order=...&email=...&...` | Branded printable invoice. "Imprimir / Guardar PDF" button → browser print → save as PDF. URL params: `order`, `email`, `name`, `product`, `amount`, `currency`, `date`. |
| `coming-soon.html` | Standalone "we'll launch soon" page (currently NOT gated; redirect was removed). |
| `admin.html` | Dashboard (auth-gated via Supabase Auth). Subtabs: Products, Articles, Homepage Videos, Reviews, Highlight (homepage product picker). Drag-reorder via SortableJS on every list. Pin (max 3) on products/articles/videos/reviews. |
| `sobre-nosotros.html` | About page. |

---

## Currency system (script.js → `window.LogramoCurrency`)

- Detects buyer country via ipapi.co → ipwho.is → geojs.io (3-source fallback chain).
- Maps country → currency (50+ currencies including all Latam: ARS, CLP, COP, PEN, UYU, BOB, DOP, GTQ, etc.).
- Fetches live USD→ccy rate from open.er-api.com → frankfurter.app fallback.
- Display prices via `LogramoCurrency.format(usdAmount)` — symbol + code (e.g., "€27.59", "R$152", "MX$549 MXN", "$29.99 USD").
- PayPal checkout uses `LogramoCurrency.checkoutCurrency()` — buyer is charged in their actual local currency if PayPal supports it (USD, EUR, GBP, MXN, BRL, etc.); otherwise falls back to USD with a "El cobro se realiza en USD" note on the product page.
- Manual override: `?ccy=EUR` URL param (used for QA only).
- Visible chip was removed from the navbar — detection still runs invisibly.

---

## Email system (Resend + Supabase Edge Functions)

| Email | Trigger | Status | File |
|---|---|---|---|
| **Welcome** | New row in `subscribers` (via Database Webhook) | ✅ Deployed | `supabase/functions/send-welcome/index.ts` |
| **Purchase confirmation + PDF + invoice link** | Called once per order by `record-purchase` after it inserts the rows. **One email per order with a download link per guide** (a cart of N guides = 1 email, not N). Accepts `{ order: { items:[...] } }`; legacy `{ record }` single-row shape still works. | ✅ Deployed | `supabase/functions/send-purchase/index.ts` |
| **+7d "How's it going?"** | Daily cron, finds purchases where `created_at < now() - 7d AND checkin_sent_at IS NULL` | ✅ Deployed (cron scheduled) | `supabase/functions/send-followups/index.ts` |
| **+14d Review request** | Daily cron, same function, finds `created_at < now() - 14d AND review_sent_at IS NULL`. Creates tokenized review link. | ✅ Deployed (same function) | `supabase/functions/send-followups/index.ts` |

**Personalization**
- Buyers (have `payer_name` from PayPal): use first name, e.g., "María".
- Subscribers (only have email): smart name parse from local-part. Strip digits, split on `._-+`, skip generic prefixes (info, hola, contacto, admin, etc.). Fall back to no greeting if generic.

**Sending stack**
- `from: Logramo <ayuda@logramo.com>`, `reply_to: ayuda@logramo.com`.
- Resend API key stored as Supabase secret `RESEND_API_KEY`.
- All emails use the magazine-style template: cream header w/ logo + date eyebrow, big Arial-Black uppercase headline, eyebrow + photo + colored panels (cream → forest → cream-alt), **sky-blue footer** with FB/YT/Pinterest icons from `cdn.simpleicons.org`.
- Social media **in emails**: only Facebook, YouTube, Pinterest (no TikTok). Note: the **site footer** (`partials.js`) also links **Instagram** (`logramo_brand`) — emails were not updated to match.

**Cron schedule**
- `0 14 * * *` UTC daily (pg_cron + pg_net), calls `send-followups`.
- Welcome still fires from the `trg_subscriber_email` pg_net trigger on `subscribers` insert. Purchase confirmation does NOT use a trigger/webhook — `record-purchase` calls `send-purchase` directly (see Email system table).

---

## What's currently TODO

The user is working through Phase 4: customer accounts + content. Specifically:

- [ ] **review.html** — the page the review-request email link opens. Reads `?token=...`, validates against `review_tokens` table, prefills name + product from the linked purchase, shows form (rating + quote + optional photo + optional dog name), submits to `reviews` table with `status='pending'`, `verified=true`.
- [ ] **Dashboard "Pending reviews" UI** — Reviews tab in `admin.html` gets a new section at top showing pending submissions with Approve/Reject buttons.
- [ ] **Email templates editor in dashboard** — let user edit subject + headline + body copy of each email type without touching code. (Long-term polish.)
- [ ] **Customer accounts (Supabase Auth signup)** — full-account signup so buyers can re-download PDFs without searching for the email. Email-gated free download for non-buyers.

---

## Logistics / habits

- **User communication style**: replies tend to be short. They expect concise, structured answers with copy/paste-ready commands.
- **Their PowerShell window**: keep it the same one across commands. Always `cd "C:\Users\rosem\OneDrive\Documents\Logramo\Logo Assets\Website Assets"` first if they reopened.
- **Sharing API keys**: the publishable `sb_publishable_...` key is safe (hardcoded in public JS). The `RESEND_API_KEY` and PayPal secrets must NEVER be pasted in chat — if accidentally shared, immediately revoke.
- **Pushing live**: only when user explicitly says so. They've said "push it live" when ready; we hold otherwise.
- **Testing emails without waiting**: insert a backdated purchase row (`created_at = now() - interval '15 days'`) → run `send-followups` manually → verify both emails arrive → delete the test row.
- **Spanish in UI / English in dashboard**: Public site is Spanish (es-LA). Dashboard admin UI is in English.

---

## Key URLs

- Live: https://logramo.com
- Supabase dashboard: https://supabase.com/dashboard/project/eopobchvkfvkkrtrzeyu
- Resend: https://resend.com (domain `logramo.com` verified)
- PayPal Developer: https://developer.paypal.com (Live app linked, sandbox kept as backup)
- GitHub: https://github.com/freeG02/Logramo-Store-front

---

## If resuming a conversation

1. Read this file.
2. Ask the user what they're trying to do next (don't assume).
3. Check `git log --oneline -10` from the worktree to see recent commits — that confirms what's deployed.
4. Check the Supabase dashboard if needed (functions list, table contents).
5. **Never** introduce any phrasing the brand voice section forbids.
6. Default to NOT pushing to GitHub until explicitly told.

---

## 🚧 Work in progress (handoff — 2026-06-09, NOT yet pushed)

All of the below is **committed locally but NOT pushed** (GitHub Pages only deploys on push). See the latest WIP commit with `git log --oneline -3`; full delta vs live with `git diff origin/main`. Last pushed/live commit is `33083b1`.

**Done this session (staged in worktree):**
- **Copy de-AI pass**: removed em-dash tic + "real/honest/auténtico" self-claiming across all customer pages + footer. Brand-voice rule lives in user memory (`feedback_logramo_copy_voice.md`).
- **"Book frame" cover system** (`.book3d` in `styles.css`): 5:7, no border, brutalist hard shadow + soft contact shadow, left spine fold, corner glow, bottom inner depth shadow. Generated cover = `.gcover` (subtitle top, title centered via `cover_title_size`cqw), top-right tilted tag `.gtag--tr`, optional integrated glass bottom banner `.gbanner`. Applied in: homepage highlight (`index.html`), biblioteca grid (`biblioteca.html`), product modal (`partials.js` renderFreebie).
- **biblioteca**: cards are now JUST the book (clickable → modal), no price/button, no category icons. Grid `minmax(205px,1fr)`. Phones (≤640px) = horizontal swipe rows (`flex`, 42% cards, ~2+peek). `?demo` URL param injects 16 fictive books for layout preview (no DB writes).
- **Product modal**: cover uses the new frame; price is terracotta; whole modal scrolls on mobile (was a dead cover area).
- **Dashboard**: "Title size on cover" slider (`p-covertitlesize`) → `products.cover_title_size`. Migration **already applied** by user (`supabase/migrations/20260608_cover_title_size.sql`). Save is resilient if column missing.
- **Homepage "Empieza aquí" cards** deep-link to `biblioteca.html?filter=…` with empty-filter fallback. Footer "Temas" links fixed to `?filter=`. Cache tokens bumped: `styles.css?v=20260714`, `partials.js?v=20260712`.
- **Admin "Danger zone" reset** + `supabase/functions/reset-data/index.ts` (wipes subscribers + purchases + pageviews via admin-gated edge fn). **NOT deployed yet** — needs `Copy-Item` mirror + `supabase functions deploy reset-data --use-api --no-verify-jwt`.

**Open items / TODO:**
- [ ] Footer **social links** still `href="#"` — need real FB/YT/Pinterest URLs from user.
- [ ] biblioteca **"Destacados" featured carousel** still uses OLD cover style — apply the frame there too (`fcCover`/`fcSlide` in biblioteca.html).
- [ ] Deploy the **reset-data** edge function (above) — UI is live but button errors until deployed.
- [ ] User to eyeball biblioteca sizing/spacing + demo fill (Claude's screenshot tool was down this session — verify visually).
- [ ] When approved: **push** (copy + book frames + biblioteca redesign + reset tool + footer fixes + slider).

**Gotcha:** Claude's local screenshot/preview navigation was flaky this session (URL params getting pinned). Verify visually in a real browser at `localhost:8099`.
