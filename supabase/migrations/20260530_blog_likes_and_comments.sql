-- ============================================================
-- BLOG LIKES + COMMENTS
-- Adds the schema for blog post likes and comments. Both
-- require an authenticated user (uses Supabase Auth's auth.uid()).
-- Read access is public so counts and approved comments are visible.
-- ============================================================

-- ---------- LIKES ----------
create table if not exists public.blog_likes (
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id    uuid not null references auth.users(id)     on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create index if not exists blog_likes_article_idx on public.blog_likes(article_id);
create index if not exists blog_likes_user_idx    on public.blog_likes(user_id);

alter table public.blog_likes enable row level security;

-- Anyone (including anon) can read like rows so the counter shows for
-- non-logged-in visitors. Auth is required only to create/destroy a like.
drop policy if exists "blog_likes read all"     on public.blog_likes;
drop policy if exists "blog_likes insert auth"  on public.blog_likes;
drop policy if exists "blog_likes delete own"   on public.blog_likes;

create policy "blog_likes read all"
  on public.blog_likes for select using (true);

create policy "blog_likes insert auth"
  on public.blog_likes for insert
  with check (auth.uid() = user_id);

create policy "blog_likes delete own"
  on public.blog_likes for delete
  using (auth.uid() = user_id);


-- ---------- COMMENTS ----------
create table if not exists public.blog_comments (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid not null references public.articles(id) on delete cascade,
  user_id      uuid not null references auth.users(id)     on delete cascade,
  author_name  text not null,
  body         text not null check (char_length(body) between 1 and 1500),
  parent_id    uuid references public.blog_comments(id) on delete cascade,
  status       text not null default 'approved'
               check (status in ('approved','pending','hidden')),
  created_at   timestamptz not null default now()
);

create index if not exists blog_comments_article_idx on public.blog_comments(article_id, created_at desc);
create index if not exists blog_comments_user_idx    on public.blog_comments(user_id);
create index if not exists blog_comments_parent_idx  on public.blog_comments(parent_id);

alter table public.blog_comments enable row level security;

drop policy if exists "blog_comments read approved" on public.blog_comments;
drop policy if exists "blog_comments insert auth"   on public.blog_comments;
drop policy if exists "blog_comments delete own"    on public.blog_comments;
drop policy if exists "blog_comments update own"    on public.blog_comments;

-- Public read for 'approved' comments. Users can always see their own
-- (covers the moment right after posting if status='pending').
create policy "blog_comments read approved"
  on public.blog_comments for select
  using (status = 'approved' or auth.uid() = user_id);

create policy "blog_comments insert auth"
  on public.blog_comments for insert
  with check (auth.uid() = user_id);

create policy "blog_comments delete own"
  on public.blog_comments for delete
  using (auth.uid() = user_id);

create policy "blog_comments update own"
  on public.blog_comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
