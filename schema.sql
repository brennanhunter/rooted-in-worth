-- =====================================================
-- Rooted in Worth — Database Schema (source of truth)
-- Paste sections into the Supabase SQL editor, or run
-- the whole file at once. Idempotent where reasonable.
-- =====================================================

-- ---------- Extensions ----------
-- Supabase enables these by default, but make it explicit.
create extension if not exists pgcrypto;

-- =====================================================
-- Shared helpers
-- =====================================================

-- Auto-update updated_at columns
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================
-- 1. profiles
-- Extends auth.users with app-level fields.
-- is_admin gates everything in the admin panel.
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Phase 2 (profiles & customization) — applied to prod 2026-05-15.
-- Additive + idempotent so re-running this file converges any
-- environment (fresh or existing) to the same shape.
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists family_size smallint,
  add column if not exists location_preference text,
  add column if not exists updated_at timestamptz not null default now(),
  -- null = hasn't been through profile setup; stamped on finish/skip
  add column if not exists onboarded_at timestamptz;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- supports the Phase 3 feed "filter by person" lookup
create index if not exists profiles_display_name_idx
  on public.profiles (lower(display_name));

-- Create a profile row automatically when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(
      coalesce(
        new.raw_user_meta_data->>'display_name',
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name'
      ),
      ''
    ),
    nullif(
      coalesce(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture'
      ),
      ''
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auth method for an email, used by the password-reset flow to send
-- the right email (reset link vs "you use Google"). Returns:
--   'none'       — no account
--   'password'   — has an email/password identity (reset is valid)
--   'oauth_only' — only third-party identities (e.g. Google)
-- SECURITY DEFINER to read the auth schema. Execute is REVOKED from
-- anon/authenticated so this can't become an account-enumeration
-- oracle — only the service role (server-side) may call it.
create or replace function public.auth_method_for_email(p_email text)
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select case
    when not exists (
      select 1 from auth.users where email = lower(p_email)
    ) then 'none'
    when exists (
      select 1
      from auth.identities i
      join auth.users u on u.id = i.user_id
      where u.email = lower(p_email) and i.provider = 'email'
    ) then 'password'
    else 'oauth_only'
  end;
$$;

revoke execute on function public.auth_method_for_email(text)
  from anon, authenticated, public;

-- Helper: is the current request from an admin?
-- SECURITY DEFINER so RLS policies can call it without recursing
-- back into profiles RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles: self can read" on public.profiles;
create policy "profiles: self can read"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: self can update" on public.profiles;
create policy "profiles: self can update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles: admins can read all" on public.profiles;
create policy "profiles: admins can read all"
  on public.profiles for select
  using (public.is_admin());

-- Public profile surface. The base `profiles` table has NO public
-- select policy, so `email` (and any future sensitive column) is never
-- readable by anon. This view is the ONLY public read path and
-- deliberately selects a safe column subset. It is intentionally NOT
-- security_invoker: it runs with the view owner's rights so logged-out
-- visitors can read the safe columns of all profiles, while RLS still
-- blocks direct table access. Add new profile columns here only if
-- they're meant to be public.
create or replace view public.public_profiles as
select
  id,
  display_name,
  avatar_url,
  bio,
  skills,
  family_size,
  location_preference,
  created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- =====================================================
-- 2. subscribers
-- The newsletter list. Public signup happens server-side
-- with the service-role key (bypasses RLS), so the only
-- RLS policies exposed to the client are admin-read/write.
-- =====================================================

do $$ begin
  create type public.subscriber_status as enum (
    'active', 'unsubscribed', 'bounced', 'complained'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  name text,
  status public.subscriber_status not null default 'active',
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  source text,                       -- e.g. "homepage", "footer", "manual"
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists subscribers_status_idx
  on public.subscribers (status);

drop trigger if exists subscribers_updated_at on public.subscribers;
create trigger subscribers_updated_at
  before update on public.subscribers
  for each row execute function public.touch_updated_at();

alter table public.subscribers enable row level security;

drop policy if exists "subscribers: admins full access" on public.subscribers;
create policy "subscribers: admins full access"
  on public.subscribers for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================
-- 3. campaigns
-- One row per newsletter sent (or being composed).
-- =====================================================

do $$ begin
  create type public.campaign_status as enum (
    'draft', 'sending', 'sent', 'failed'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  preview_text text,
  body_html text not null,
  body_text text,
  status public.campaign_status not null default 'draft',
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists campaigns_updated_at on public.campaigns;
create trigger campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.touch_updated_at();

alter table public.campaigns enable row level security;

drop policy if exists "campaigns: admins full access" on public.campaigns;
create policy "campaigns: admins full access"
  on public.campaigns for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================
-- 4. campaign_sends
-- Per-recipient send log. Lets us see exactly who got
-- what, capture Resend message IDs (for webhook bounce
-- tracking), and report failures.
-- =====================================================

do $$ begin
  create type public.send_status as enum (
    'queued', 'sent', 'failed', 'bounced', 'complained'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.campaign_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  resend_message_id text,
  status public.send_status not null default 'queued',
  error text,
  sent_at timestamptz,
  unique (campaign_id, subscriber_id)
);

create index if not exists campaign_sends_campaign_idx
  on public.campaign_sends (campaign_id);
create index if not exists campaign_sends_subscriber_idx
  on public.campaign_sends (subscriber_id);

alter table public.campaign_sends enable row level security;

drop policy if exists "campaign_sends: admins full access" on public.campaign_sends;
create policy "campaign_sends: admins full access"
  on public.campaign_sends for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================
-- 5. posts (Phase 3 — community feed) — applied to prod 2026-05-15.
-- Public read (feed open to non-members), members write their own,
-- authors/admins modify. Moderation slice (2026-05-15) adds soft-delete
-- via `deleted_at`: the public read policy now hides removed posts;
-- the admin moderation queue reads them back via the service role.
-- =====================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Soft delete: removed/moderated posts keep the row (reviewable) but
-- disappear from every public read via the policy below.
alter table public.posts
  add column if not exists deleted_at timestamptz;

create index if not exists posts_created_at_idx
  on public.posts (created_at desc);
create index if not exists posts_tags_gin_idx
  on public.posts using gin (tags);

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

-- Public read EXCLUDES soft-deleted posts. The admin moderation queue
-- uses the service role (bypasses RLS) to see removed/reported ones.
drop policy if exists "posts: anyone can read" on public.posts;
create policy "posts: anyone can read"
  on public.posts for select
  using (deleted_at is null);

drop policy if exists "posts: members can create own" on public.posts;
create policy "posts: members can create own"
  on public.posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "posts: author or admin can modify" on public.posts;
create policy "posts: author or admin can modify"
  on public.posts for update
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

drop policy if exists "posts: author or admin can delete" on public.posts;
create policy "posts: author or admin can delete"
  on public.posts for delete
  using (auth.uid() = author_id or public.is_admin());

-- =====================================================
-- 6. post_reports (Phase 3 moderation) — applied 2026-05-15.
-- Any signed-in user can report a post once. No public/self read —
-- the queue is reviewed by the admin (service role, bypasses RLS).
-- =====================================================

do $$ begin
  create type public.report_status as enum ('open', 'actioned', 'dismissed');
exception when duplicate_object then null; end $$;

create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text check (reason is null or char_length(reason) <= 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (post_id, reporter_id)
);

create index if not exists post_reports_status_idx
  on public.post_reports (status, created_at desc);
create index if not exists post_reports_post_idx
  on public.post_reports (post_id);

alter table public.post_reports enable row level security;

-- Signed-in users may file a report as themselves. No select policy:
-- reports are not readable via the anon/auth API at all; only the
-- service-role admin queue sees them.
drop policy if exists "post_reports: members can report" on public.post_reports;
create policy "post_reports: members can report"
  on public.post_reports for insert
  with check (auth.uid() = reporter_id);

-- =====================================================
-- 7. profile_reports (Phase 3 moderation) — applied 2026-05-15.
-- Same shape/policy as post_reports, but for reporting a published
-- avatar/profile. Closes the gap where avatars were only pre-publish
-- moderated with no user report path. Reuses report_status.
-- =====================================================

create table if not exists public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text check (reason is null or char_length(reason) <= 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (profile_id, reporter_id)
);

create index if not exists profile_reports_status_idx
  on public.profile_reports (status, created_at desc);
create index if not exists profile_reports_profile_idx
  on public.profile_reports (profile_id);

alter table public.profile_reports enable row level security;

drop policy if exists "profile_reports: members can report" on public.profile_reports;
create policy "profile_reports: members can report"
  on public.profile_reports for insert
  with check (auth.uid() = reporter_id);

-- =====================================================
-- 8. post_likes (Phase 3) — applied 2026-05-15.
-- One like per user per post (PK enforces it). Counts are public so
-- the feed can show them to everyone; members like/unlike only their
-- own row.
-- =====================================================

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_post_idx
  on public.post_likes (post_id);

alter table public.post_likes enable row level security;

drop policy if exists "post_likes: anyone can read" on public.post_likes;
create policy "post_likes: anyone can read"
  on public.post_likes for select
  using (true);

drop policy if exists "post_likes: members like own" on public.post_likes;
create policy "post_likes: members like own"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "post_likes: members unlike own" on public.post_likes;
create policy "post_likes: members unlike own"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- =====================================================
-- 9. post_replies (Phase 3) — applied 2026-05-15.
-- Flat replies (no reply-to-reply). Public read excludes soft-deleted;
-- members write/edit/delete their own; authors/admins moderate. Same
-- soft-delete model as posts so removed replies are reviewable.
-- =====================================================

create table if not exists public.post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists post_replies_post_idx
  on public.post_replies (post_id, created_at);

drop trigger if exists post_replies_updated_at on public.post_replies;
create trigger post_replies_updated_at
  before update on public.post_replies
  for each row execute function public.touch_updated_at();

alter table public.post_replies enable row level security;

drop policy if exists "post_replies: anyone can read" on public.post_replies;
create policy "post_replies: anyone can read"
  on public.post_replies for select
  using (deleted_at is null);

drop policy if exists "post_replies: members create own" on public.post_replies;
create policy "post_replies: members create own"
  on public.post_replies for insert
  with check (auth.uid() = author_id);

drop policy if exists "post_replies: author or admin modify" on public.post_replies;
create policy "post_replies: author or admin modify"
  on public.post_replies for update
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

drop policy if exists "post_replies: author or admin delete" on public.post_replies;
create policy "post_replies: author or admin delete"
  on public.post_replies for delete
  using (auth.uid() = author_id or public.is_admin());

-- =====================================================
-- 10. reply_reports (Phase 3 moderation) — applied 2026-05-15.
-- Same hardened pattern as post_reports/profile_reports.
-- =====================================================

create table if not exists public.reply_reports (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid not null references public.post_replies(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text check (reason is null or char_length(reason) <= 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (reply_id, reporter_id)
);

create index if not exists reply_reports_status_idx
  on public.reply_reports (status, created_at desc);
create index if not exists reply_reports_reply_idx
  on public.reply_reports (reply_id);

alter table public.reply_reports enable row level security;

drop policy if exists "reply_reports: members can report" on public.reply_reports;
create policy "reply_reports: members can report"
  on public.reply_reports for insert
  with check (auth.uid() = reporter_id);

-- =====================================================
-- Storage: avatars bucket
-- Public-read so <Image> can render avatars without auth. Writes are
-- restricted by RLS to a folder named after the user's own uid, and
-- the bucket itself enforces size + mime limits server-side (defense
-- in depth — not just client validation).
-- =====================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- A user may only write within a top-level folder equal to their uid,
-- e.g. avatars/<uid>/avatar.jpg. They cannot touch anyone else's.
drop policy if exists "avatars: owner insert" on storage.objects;
create policy "avatars: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "avatars: owner update" on storage.objects;
create policy "avatars: owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- =====================================================
-- One-time bootstrap
-- After you sign up your own account through Supabase Auth,
-- run this with your email to make yourself an admin:
--
-- update public.profiles
--    set is_admin = true
--  where email = 'brennanhunter58@gmail.com';
-- =====================================================
