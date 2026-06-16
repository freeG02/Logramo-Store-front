-- Live "who's on the site right now" + active carts. Each visitor tab calls
-- presence_beat() every ~25s with its current path, country and cart state. The
-- dashboard counts rows whose last_seen is within the last minute, so a tab that
-- closes drops out once its heartbeats stop. Cookieless: the session id lives in
-- sessionStorage, sets no cookie and shares no identifier.
--
-- Writes go through a SECURITY DEFINER function, NOT direct table access: an
-- upsert (INSERT ... ON CONFLICT DO UPDATE) needs to read the conflicting row,
-- which RLS would block for anon. The function does the upsert as owner, so the
-- table stays fully locked — admins read, nobody writes it directly.

create table if not exists public.presence (
  session_id text primary key,
  path text,
  country text,
  referrer text,
  cart_count int not null default 0,
  cart_value numeric not null default 0,
  last_seen timestamptz not null default now()
);

-- (for upgrades from the first version of this table)
alter table public.presence add column if not exists cart_count int not null default 0;
alter table public.presence add column if not exists cart_value numeric not null default 0;

create index if not exists presence_last_seen_idx on public.presence(last_seen);

alter table public.presence enable row level security;

-- Only admins read the live list for the dashboard. Customers/anon cannot.
drop policy if exists "presence admin read" on public.presence;
create policy "presence admin read" on public.presence for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  ));

-- No direct public write policies — the v1 ones are dropped; writes happen only
-- through presence_beat() below.
drop policy if exists "presence insert" on public.presence;
drop policy if exists "presence update" on public.presence;

create or replace function public.presence_beat(
  p_session text,
  p_path text,
  p_country text default '',
  p_referrer text default '',
  p_cart_count int default 0,
  p_cart_value numeric default 0
) returns void
language sql security definer set search_path = public as $$
  insert into public.presence (session_id, path, country, referrer, cart_count, cart_value, last_seen)
  values (p_session, p_path, coalesce(p_country,''), coalesce(p_referrer,''),
          coalesce(p_cart_count,0), coalesce(p_cart_value,0), now())
  on conflict (session_id) do update set
    path = excluded.path,
    country = excluded.country,
    referrer = excluded.referrer,
    cart_count = excluded.cart_count,
    cart_value = excluded.cart_value,
    last_seen = now();
$$;

grant execute on function public.presence_beat(text,text,text,text,int,numeric) to anon, authenticated;

-- Keep the table tiny: drop heartbeats older than an hour, every 15 min, via
-- pg_cron (already enabled for the email follow-ups). Guarded so the migration
-- still applies on a database without pg_cron.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if exists (select 1 from cron.job where jobname = 'presence_cleanup') then
      perform cron.unschedule('presence_cleanup');
    end if;
    perform cron.schedule(
      'presence_cleanup',
      '*/15 * * * *',
      $cron$delete from public.presence where last_seen < now() - interval '1 hour'$cron$
    );
  end if;
end $$;
