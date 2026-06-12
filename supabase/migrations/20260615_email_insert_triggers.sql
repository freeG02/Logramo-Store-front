-- The purchase + welcome emails were meant to fire from dashboard "Database
-- Webhooks" that were never wired up, so confirmation emails never sent even
-- though rows recorded. Replace that with real, version-controlled pg_net
-- triggers (the account email already works this way).
--
-- pg_net is async/fire-and-forget, so a slow or failing email never blocks or
-- rolls back the insert. The publishable key below is the public anon key.

create or replace function public.notify_edge_email() returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
begin
  perform net.http_post(
    url := 'https://eopobchvkfvkkrtrzeyu.supabase.co/functions/v1/' || TG_ARGV[0],
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_6GZ1L30_DktAPRbsPs-6Lg_PSqJ5c-D',
      'Authorization', 'Bearer sb_publishable_6GZ1L30_DktAPRbsPs-6Lg_PSqJ5c-D'
    ),
    body := jsonb_build_object('record', to_jsonb(NEW))
  );
  return NEW;
end;
$$;

-- Purchase confirmation on every new purchase.
drop trigger if exists trg_purchase_email on public.purchases;
create trigger trg_purchase_email
  after insert on public.purchases
  for each row execute function public.notify_edge_email('send-purchase');

-- Welcome on every new newsletter subscriber. send-welcome itself skips rows
-- with source='account-signup' (those are welcomed by send-account-welcome),
-- so account signups never get two emails.
drop trigger if exists trg_subscriber_email on public.subscribers;
create trigger trg_subscriber_email
  after insert on public.subscribers
  for each row execute function public.notify_edge_email('send-welcome');
