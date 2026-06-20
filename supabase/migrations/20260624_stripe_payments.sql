-- STRIPE migration for public.purchases.
--
-- Payments moved from PayPal Smart Buttons (client capture + record-purchase
-- verification) to Stripe Checkout (hosted) + the stripe-webhook edge function.
-- A Stripe Checkout Session is the unit of an order: a cart of N guides is ONE
-- session, and stripe-webhook writes one purchases row per guide, all sharing
-- the same stripe_session_id (mirrors how paypal_order_id grouped rows before).
--
-- We KEEP paypal_order_id (nullable) so historical PayPal orders stay intact;
-- new rows populate stripe_session_id instead. Idempotency is handled in code
-- (the webhook skips product ids already recorded for the session), so no unique
-- constraint is added here. Safe + idempotent to re-run.

alter table public.purchases
  add column if not exists stripe_session_id text;

create index if not exists purchases_stripe_session_id_idx
  on public.purchases (stripe_session_id);
