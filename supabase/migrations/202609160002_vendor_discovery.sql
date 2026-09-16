-- Website media and promotion evidence. Existing vendor RLS controls visibility.
alter table public.vendors add column if not exists discovery jsonb not null default '{"images":[],"offers":[]}'::jsonb;
create index if not exists vendors_recent_osm on public.vendors(country_id, category, last_scraped desc)
  where status = 'verified' and place_id like 'osm:%';
