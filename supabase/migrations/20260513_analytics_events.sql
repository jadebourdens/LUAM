create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  listing_id uuid references public.listings(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

create policy if not exists analytics_insert_any on public.analytics_events
for insert to anon, authenticated
with check (true);

create policy if not exists analytics_select_auth on public.analytics_events
for select to authenticated
using (auth.uid() = user_id);

create index if not exists idx_analytics_event_name_time on public.analytics_events(event_name, created_at desc);
create index if not exists idx_analytics_listing on public.analytics_events(listing_id);
