-- Run this once in Supabase SQL Editor on an existing PetSquare database.
create table if not exists public.apify_pet_data (
  item_key text primary key,
  actor_id text not null,
  run_id text not null,
  payload jsonb not null,
  synced_at timestamptz not null default now()
);

create index if not exists idx_apify_pet_data_synced_at
  on public.apify_pet_data(synced_at desc);

alter table public.apify_pet_data enable row level security;

drop policy if exists "public read cached pet data" on public.apify_pet_data;
create policy "public read cached pet data"
  on public.apify_pet_data for select using (true);
