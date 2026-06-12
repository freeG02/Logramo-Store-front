-- The admin dashboard reads orders + subscribers as the logged-in admin, but no
-- SELECT policy permitted it, so Sales, revenue and the acquisition panel looked
-- empty even with data in the table. Allow ONLY admins (profiles.is_admin) to
-- read purchases + subscribers. Customers and anonymous visitors still cannot.

drop policy if exists "admins can read purchases" on public.purchases;
create policy "admins can read purchases"
  on public.purchases for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  ));

drop policy if exists "admins can read subscribers" on public.subscribers;
create policy "admins can read subscribers"
  on public.subscribers for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  ));
