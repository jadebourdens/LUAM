-- Trust & Safety V1
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(blocker_user_id, blocked_user_id)
);

alter table public.reports enable row level security;
alter table public.blocked_users enable row level security;

create policy if not exists reports_insert_own on public.reports
for insert to authenticated
with check (auth.uid() = reporter_user_id);

create policy if not exists reports_select_own on public.reports
for select to authenticated
using (auth.uid() = reporter_user_id);

create policy if not exists blocked_users_insert_own on public.blocked_users
for insert to authenticated
with check (auth.uid() = blocker_user_id);

create policy if not exists blocked_users_select_own on public.blocked_users
for select to authenticated
using (auth.uid() = blocker_user_id);

create index if not exists idx_reports_status_created on public.reports(status, created_at desc);
create index if not exists idx_blocked_users_blocker on public.blocked_users(blocker_user_id);
