-- HARDENING: remove the open anon INSERT policy on purchases.
--
-- Purchases are now recorded by the `record-purchase` edge function, which
-- independently verifies the PayPal order (status COMPLETED) and inserts with
-- the SERVICE ROLE key (service role bypasses RLS, so it is unaffected by this
-- drop). The client-side fallback that relied on this open policy is therefore
-- retired: only PayPal-verified server inserts can write a purchase now, which
-- stops anyone from POSTing fake purchase rows (and triggering fake
-- confirmation emails) with the publishable key.
--
-- The subscribers open-insert policy is intentionally left in place — newsletter
-- signups still come straight from the anonymous client.

drop policy if exists "storefront can insert purchases" on public.purchases;
