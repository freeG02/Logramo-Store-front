-- Add-to-cart event log. The storefront writes one row each time a visitor
-- taps "Añadir al carrito" in the library (gated on cookie consent, exactly like
-- pageviews). The admin "Most added to cart" panel reads these to rank products
-- by purchase intent.

create table if not exists public.cart_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_title text,
  price numeric,
  country text,
  created_at timestamptz not null default now()
);

create index if not exists cart_events_product_idx on public.cart_events(product_id);
create index if not exists cart_events_created_idx on public.cart_events(created_at);

alter table public.cart_events enable row level security;

-- Storefront (publishable key, public role) can log an add-to-cart. INSERT only;
-- it cannot read, update, or delete. Matches the subscribers insert policy.
drop policy if exists "storefront can insert cart events" on public.cart_events;
create policy "storefront can insert cart events"
  on public.cart_events for insert
  with check (true);

-- Only admins (profiles.is_admin) can read the log for the dashboard panel.
-- Customers and anonymous visitors cannot. Mirrors the purchases read policy.
drop policy if exists "admins can read cart events" on public.cart_events;
create policy "admins can read cart events"
  on public.cart_events for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  ));
