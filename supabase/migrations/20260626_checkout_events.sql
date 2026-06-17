-- "Started checkout" event log (Meta InitiateCheckout, first-party). The
-- storefront writes one row each time a visitor opens PayPal/card checkout (cart
-- sidebar or product page). The admin "Conversion funnel" reads these to show the
-- step between add-to-cart and purchase. Mirrors cart_events: open INSERT,
-- admin-only SELECT, cookieless, no PII.

create table if not exists public.checkout_events (
  id uuid primary key default gen_random_uuid(),
  num_items int,
  value numeric,
  country text,
  created_at timestamptz not null default now()
);

create index if not exists checkout_events_created_idx on public.checkout_events(created_at);

alter table public.checkout_events enable row level security;

drop policy if exists "storefront can insert checkout events" on public.checkout_events;
create policy "storefront can insert checkout events"
  on public.checkout_events for insert
  with check (true);

drop policy if exists "admins can read checkout events" on public.checkout_events;
create policy "admins can read checkout events"
  on public.checkout_events for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  ));
