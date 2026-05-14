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

-- Create a profile row automatically when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
  using (auth.uid() = id);

drop policy if exists "profiles: admins can read all" on public.profiles;
create policy "profiles: admins can read all"
  on public.profiles for select
  using (public.is_admin());

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
-- One-time bootstrap
-- After you sign up your own account through Supabase Auth,
-- run this with your email to make yourself an admin:
--
-- update public.profiles
--    set is_admin = true
--  where email = 'brennanhunter58@gmail.com';
-- =====================================================
