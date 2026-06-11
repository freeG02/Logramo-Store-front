-- Schedule the blog-announcement broadcast (send-blog-broadcast) every 15 min.
-- Mirrors how send-followups is scheduled (pg_cron + pg_net). The function is
-- deployed with --no-verify-jwt; the publishable key here is the public anon
-- key (safe to embed) and only routes the request through the gateway.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'logramo-blog-broadcast') then
    perform cron.unschedule('logramo-blog-broadcast');
  end if;
end $$;

select cron.schedule(
  'logramo-blog-broadcast',
  '*/15 * * * *',
  $job$
  select net.http_post(
    url := 'https://eopobchvkfvkkrtrzeyu.supabase.co/functions/v1/send-blog-broadcast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_6GZ1L30_DktAPRbsPs-6Lg_PSqJ5c-D',
      'Authorization', 'Bearer sb_publishable_6GZ1L30_DktAPRbsPs-6Lg_PSqJ5c-D'
    )
  );
  $job$
);
