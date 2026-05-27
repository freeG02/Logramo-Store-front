-- ============================================================
-- ADMIN ROLE + COMMENT MODERATION POLICIES
-- After running this you MUST mark YOUR profile as admin manually.
-- See the UPDATE near the bottom — edit the email then run that line.
-- ============================================================

-- 1) Add is_admin flag to profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Helper function so policies stay readable
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- 2) Let admins SELECT every comment (regardless of status)
drop policy if exists "blog_comments admin read all" on public.blog_comments;
create policy "blog_comments admin read all"
  on public.blog_comments for select
  using (public.is_admin(auth.uid()));

-- 3) Let admins UPDATE any comment (used for status='hidden')
drop policy if exists "blog_comments admin update" on public.blog_comments;
create policy "blog_comments admin update"
  on public.blog_comments for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 4) Let admins DELETE any comment
drop policy if exists "blog_comments admin delete" on public.blog_comments;
create policy "blog_comments admin delete"
  on public.blog_comments for delete
  using (public.is_admin(auth.uid()));

-- 5) Same three for likes — useful for cleaning up spam likes if ever needed
drop policy if exists "blog_likes admin delete" on public.blog_likes;
create policy "blog_likes admin delete"
  on public.blog_likes for delete
  using (public.is_admin(auth.uid()));

-- ============================================================
-- ⚠️ EDIT THIS LINE WITH YOUR ADMIN EMAIL AND RUN IT SEPARATELY
-- ============================================================
-- update public.profiles set is_admin = true where email = 'tu-correo-admin@example.com';
