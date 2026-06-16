-- pageviews predates the migrations folder; its RLS was configured in the
-- dashboard, so no policy file existed. The admin dashboard reads pageviews for
-- the Visits count + traffic charts, but if no SELECT policy grants admins, the
-- panel reads empty even with rows in the table -- the same bug 20260616 fixed
-- for purchases + subscribers. Ensure the admin-read policy exists here too.
--
-- Idempotent: safe whether or not the policy already exists. Anonymous/customer
-- reads stay blocked; the storefront's cookieless INSERT (HTTP 201) is unaffected.

alter table public.pageviews enable row level security;

drop policy if exists "admins can read pageviews" on public.pageviews;
create policy "admins can read pageviews"
  on public.pageviews for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  ));
