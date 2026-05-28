-- ============================================================
-- UNIQUE USERNAMES + ADMIN COMMENT REACTIONS
-- 1) Case-insensitive unique usernames on profiles.
-- 2) Admin can "like" any comment and reply as Logramo; both are
--    surfaced publicly so readers know the admin reacted.
-- The admin flags are enforced server-side (trigger) so a regular
-- user cannot spoof them from the client.
-- ============================================================

-- ---------- 1) UNIQUE USERNAMES (case-insensitive) ----------
-- Enforced with a trigger rather than a unique index ON PURPOSE: the product
-- decision is to block only NEW duplicates and leave any pre-existing duplicate
-- rows untouched. A unique index would refuse to build while duplicates exist;
-- this trigger applies cleanly regardless and simply rejects a new/changed
-- username that collides with a DIFFERENT user (case-insensitive).
create or replace function public.enforce_unique_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.profiles
     where lower(username) = lower(new.username)
       and id <> new.id
  ) then
    raise exception 'Ese nombre de usuario ya está en uso.' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_unique_username on public.profiles;
create trigger trg_enforce_unique_username
  before insert or update of username on public.profiles
  for each row execute function public.enforce_unique_username();

-- Lets the (possibly anonymous) signup form check availability BEFORE
-- creating the auth user, so we never orphan an auth account on a clash.
-- security definer so it can read profiles without exposing the table.
create or replace function public.username_available(name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(trim(name))
  );
$$;
grant execute on function public.username_available(text) to anon, authenticated;


-- ---------- 2) ADMIN COMMENT REACTIONS ----------
alter table public.blog_comments
  add column if not exists admin_liked     boolean not null default false,
  add column if not exists is_admin_author boolean not null default false;

-- Derive/guard the admin flags on every write so they cannot be spoofed:
--   * is_admin_author is ALWAYS computed from the author's real admin status
--   * admin_liked may only be changed by an admin
create or replace function public.enforce_comment_admin_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_admin_author := public.is_admin(new.user_id);
  if tg_op = 'INSERT' then
    if new.admin_liked and not public.is_admin(auth.uid()) then
      new.admin_liked := false;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.admin_liked is distinct from old.admin_liked
       and not public.is_admin(auth.uid()) then
      new.admin_liked := old.admin_liked;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_comment_admin_flags on public.blog_comments;
create trigger trg_enforce_comment_admin_flags
  before insert or update on public.blog_comments
  for each row execute function public.enforce_comment_admin_flags();

-- Backfill is_admin_author for any comments already authored by an admin.
update public.blog_comments c
  set is_admin_author = public.is_admin(c.user_id)
  where is_admin_author is distinct from public.is_admin(c.user_id);
