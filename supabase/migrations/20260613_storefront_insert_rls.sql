-- FIX (critical): the storefront writes purchases and newsletter signups as the
-- ANONYMOUS role — buyers and visitors are not logged in. RLS was denying those
-- inserts (error 42501), so purchases never recorded in the dashboard and the
-- confirmation/welcome emails (which fire on insert) never went out.
--
-- Grant INSERT only (no select/update/delete) to anon + authenticated. Reads
-- stay restricted, so buyers still cannot see other people's orders.
--
-- Note: we intentionally do NOT toggle "enable row level security" here. If a
-- table already enforces RLS, this policy fixes it; if it doesn't, the policy is
-- harmless. Either way inserts work and nothing else loosens.

drop policy if exists "storefront can insert purchases" on public.purchases;
create policy "storefront can insert purchases"
  on public.purchases for insert
  to anon, authenticated
  with check (true);

drop policy if exists "storefront can insert subscribers" on public.subscribers;
create policy "storefront can insert subscribers"
  on public.subscribers for insert
  to anon, authenticated
  with check (true);
