-- Broadcast emails + unsubscribe + acquisition attribution
-- Adds: opt-out flag and acquisition channel on subscribers, blog-announcement
-- tracking on articles, and acquisition channel on purchases.

-- Newsletter opt-out. NULL = still subscribed. Broadcasts filter on this.
alter table public.subscribers add column if not exists unsubscribed_at timestamptz;

-- First-touch acquisition channel (email / facebook / youtube / pinterest /
-- google / direct / other). Distinct from subscribers.source, which records
-- WHERE on the site they signed up (popup / chat / ...).
alter table public.subscribers add column if not exists channel text;

-- When the blog-announcement email for this article was sent. NULL = not yet
-- announced. The send-blog-broadcast cron only emails rows where this is NULL.
alter table public.articles add column if not exists announced_at timestamptz;

-- IMPORTANT: backfill existing articles so the first cron run does NOT blast
-- the entire back-catalogue to the list. Only articles created from now on
-- (with announced_at left NULL) will trigger an announcement.
update public.articles set announced_at = now() where announced_at is null;

-- Acquisition channel for buyers (same vocabulary as subscribers.channel).
alter table public.purchases add column if not exists channel text;
