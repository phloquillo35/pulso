-- ─── Pulso schema (Supabase / Postgres) ───────────────────────────────
-- Multi-tenant: every row is scoped to a user via auth.uid() through RLS.

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

-- Connected social accounts
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  handle text not null,
  display_name text,
  avatar_url text,
  followers integer not null default 0,
  following integer,
  bio text,
  category text,
  connected boolean not null default true,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- Posts (per account)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  platform text not null,
  caption text,
  media_type text,
  published_at timestamptz not null,
  hashtags text[] not null default '{}',
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Daily aggregated metrics (one row per account per day)
create table if not exists public.daily_metrics (
  account_id uuid not null references public.accounts (id) on delete cascade,
  date date not null,
  followers integer not null default 0,
  engagement integer not null default 0,
  reach integer not null default 0,
  impressions integer not null default 0,
  new_followers integer not null default 0,
  unfollows integer not null default 0,
  primary key (account_id, date)
);

-- Hashtag performance
create table if not exists public.hashtag_stats (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  tag text not null,
  uses integer not null default 0,
  total_likes integer not null default 0,
  avg_engagement numeric not null default 0,
  reach integer not null default 0
);

-- Competitors being benchmarked
create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  handle text not null,
  display_name text,
  followers integer not null default 0,
  avg_engagement_rate numeric not null default 0,
  posting_frequency numeric not null default 0,
  growth_30d numeric not null default 0
);

-- AI / data-driven insights
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  kind text not null,
  title text not null,
  detail text not null,
  severity text not null default 'info',
  created_at timestamptz not null default now()
);

-- Audit scores
create table if not exists public.audit_scores (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  overall integer not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  grade text not null default 'C',
  recommendations text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────
create index if not exists idx_accounts_user on public.accounts (user_id);
create index if not exists idx_posts_account on public.posts (account_id);
create index if not exists idx_daily_account on public.daily_metrics (account_id);
create index if not exists idx_competitors_user on public.competitors (user_id);
create index if not exists idx_insights_account on public.insights (account_id);

-- ─── Row Level Security ──────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.posts enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.hashtag_stats enable row level security;
alter table public.competitors enable row level security;
alter table public.insights enable row level security;
alter table public.audit_scores enable row level security;

-- profiles: a user sees/edits only their own
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- helper: account owner check
create policy "accounts_owner" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "posts_owner" on public.posts
  for all using (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

create policy "daily_owner" on public.daily_metrics
  for all using (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

create policy "hashtag_owner" on public.hashtag_stats
  for all using (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

create policy "competitors_owner" on public.competitors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "insights_owner" on public.insights
  for all using (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

create policy "audit_owner" on public.audit_scores
  for all using (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  );

-- ─── Trigger: auto-create profile on signup ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
