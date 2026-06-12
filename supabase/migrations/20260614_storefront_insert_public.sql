-- The previous policy scoped INSERT to roles anon + authenticated, but the
-- storefront's publishable key evidently runs under a different role, so inserts
-- were still rejected (42501). Recreate the INSERT policy for ALL roles (PUBLIC,
-- i.e. no TO clause) so any storefront request can record a purchase / signup.
-- Still INSERT-only: reads/updates/deletes stay restricted.

drop policy if exists "storefront can insert purchases" on public.purchases;
create policy "storefront can insert purchases"
  on public.purchases for insert
  with check (true);

drop policy if exists "storefront can insert subscribers" on public.subscribers;
create policy "storefront can insert subscribers"
  on public.subscribers for insert
  with check (true);
