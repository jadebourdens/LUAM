create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references auth.users(id) on delete cascade not null,
  seller_id uuid references auth.users(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamptz not null default now(),
  unique(order_id)
);

alter table public.reviews enable row level security;

create policy if not exists "Reviews are viewable by everyone" on public.reviews
  for select using (true);

create policy if not exists "Users can insert their own reviews" on public.reviews
  for insert with check (auth.uid() = reviewer_id);
