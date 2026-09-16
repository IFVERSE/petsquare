-- ============================================================================
-- PetSquare — Phase 2 Supabase Schema
-- ============================================================================
-- Run this once in Supabase SQL Editor (or via `supabase db push`) on a fresh
-- project. Safe to re-run: everything is guarded with IF NOT EXISTS / OR REPLACE.
--
-- Order: extensions -> enums -> tables -> functions -> RLS policies -> triggers
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================================
-- ENUMS
-- ============================================================================

do $$ begin
  create type account_type as enum ('pet_owner', 'vendor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vendor_status as enum ('pending', 'verified', 'suspended', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vendor_source as enum ('scraped', 'vendor_submitted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum ('active', 'pending_verification', 'expired', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type availability_status as enum ('in_stock', 'limited', 'out_of_stock', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type comment_status as enum ('visible', 'hidden', 'flagged');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('pending', 'under_review', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_access_status as enum ('pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type saved_item_type as enum ('vendor', 'deal', 'product', 'service');
exception when duplicate_object then null; end $$;

do $$ begin
  create type category_type as enum ('product', 'service', 'species');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- CORE REFERENCE TABLES: countries, languages, categories
-- ============================================================================

create table if not exists countries (
  id serial primary key,
  code text unique not null,          -- ISO 3166-1 alpha-2, e.g. 'DE'
  name text not null,
  currency text not null default 'EUR'
);

create table if not exists languages (
  id serial primary key,
  code text unique not null,          -- ISO 639-1, e.g. 'de'
  name text not null,
  native_name text not null
);

create table if not exists cities (
  id serial primary key,
  country_id int references countries(id) on delete cascade,
  name text not null,
  lat double precision,
  lng double precision
);

create table if not exists categories (
  id serial primary key,
  type category_type not null,
  parent_id int references categories(id) on delete cascade,
  slug text not null,
  name text not null,
  emoji text,
  translations jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_hidden boolean not null default false,
  unique (type, slug)
);

-- ============================================================================
-- PROFILES — one row per auth.users user
-- ============================================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  account_type account_type not null default 'pet_owner',
  preferred_language text default 'en',
  preferred_currency text default 'EUR',
  city_id int references cities(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- ADMIN / RBAC
-- ============================================================================

create table if not exists admin_roles (
  id serial primary key,
  name text unique not null,           -- 'super_admin', 'operations_admin', ...
  label text not null,                 -- 'Super Admin'
  permissions jsonb not null default '[]'::jsonb, -- e.g. ["vendors.manage","deals.manage"]
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

-- Authorization list: an email must exist here (status = 'active') before
-- that person is allowed to sign up / sign in as an administrator.
create table if not exists admin_access (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role_id int not null references admin_roles(id),
  status admin_access_status not null default 'pending',
  invited_by uuid references profiles(id),
  user_id uuid references profiles(id),  -- filled in once they actually sign up
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references profiles(id),
  action text not null,                -- 'vendor.suspend', 'admin.role_change', ...
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- VENDORS, PRODUCTS/DEALS, SERVICES
-- ============================================================================

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id),   -- null until a vendor account claims it
  slug text unique not null,
  name text not null,
  category text not null,                   -- retailer | veterinary | grooming | boarding | training | memorial
  species text[] not null default '{}',
  description text,
  logo_url text,
  cover_image_url text,
  discovery jsonb not null default '{"images":[],"offers":[]}'::jsonb,
  phone text,
  website text,
  address text,
  city_id int references cities(id),
  country_id int references countries(id),
  lat double precision,
  lng double precision,
  place_id text unique,
  google_rating numeric(2,1),
  review_count int default 0,
  business_status text default 'OPERATIONAL',
  badges text[] not null default '{}',      -- business_verified | website_verified | deal_verified | community_reported
  status vendor_status not null default 'pending',
  source vendor_source not null default 'scraped',
  last_verified timestamptz,
  last_scraped timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendors_status on vendors(status);
create index if not exists idx_vendors_category on vendors(category);
create index if not exists idx_vendors_city on vendors(city_id);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  category_id int references categories(id),
  name text not null,
  description text,
  image_url text,
  species text[] not null default '{}',
  original_price numeric(10,2) not null,
  discount_price numeric(10,2) not null,
  discount_percent numeric(5,2) generated always as (
    case when original_price > 0
      then round(((original_price - discount_price) / original_price) * 100, 2)
      else 0
    end
  ) stored,
  currency text not null default 'EUR',
  availability availability_status not null default 'unknown',
  deal_starts_at timestamptz,
  deal_ends_at timestamptz,
  source_url text unique,
  status product_status not null default 'pending_verification',
  last_checked timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_discount_valid check (discount_price <= original_price)
);

create index if not exists idx_products_vendor on products(vendor_id);
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_category on products(category_id);

-- Fast cache for external Apify Actor datasets. Visitor requests read this
-- table and never wait for a live Actor run.
create table if not exists apify_pet_data (
  item_key text primary key,
  actor_id text not null,
  run_id text not null,
  payload jsonb not null,
  synced_at timestamptz not null default now()
);

create index if not exists idx_apify_pet_data_synced_at on apify_pet_data(synced_at desc);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  name text not null,
  description text,
  price_from numeric(10,2),
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PETS (pet owner profiles)
-- ============================================================================

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  date_of_birth date,
  gender text,
  size text,
  weight_kg numeric(5,2),
  dietary_preferences text[],
  activity_level text,
  allergies text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- COMMUNITY: comments/reviews, reports, saved items, price alerts
-- ============================================================================

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  status comment_status not null default 'visible',
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,   -- 'vendor' | 'product' | 'comment'
  target_id uuid not null,
  reason text not null,
  details text,
  reporter_id uuid references profiles(id),
  status report_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  item_type saved_item_type not null,
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  target_price numeric(10,2) not null,
  triggered_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SCRAPING JOBS (Phase 3 will write into this)
-- ============================================================================

create table if not exists scraping_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'scheduled', -- scheduled | running | failed | completed | paused
  websites_scanned int default 0,
  vendors_discovered int default 0,
  products_discovered int default 0,
  deals_discovered int default 0,
  deals_updated int default 0,
  deals_expired int default 0,
  failed_websites int default 0,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CONTENT: blog posts, newsletter subscribers
-- ============================================================================

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  featured_image_url text,
  status text not null default 'draft', -- draft | scheduled | published
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  segments text[] not null default '{}',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- ============================================================================
-- HELPER FUNCTIONS for RBAC checks inside RLS policies
-- ============================================================================

-- Returns the active admin_access row (if any) for the currently authenticated user.
create or replace function current_admin_role()
returns text
language sql
security definer
stable
as $$
  select ar.name
  from admin_access aa
  join admin_roles ar on ar.id = aa.role_id
  where aa.user_id = auth.uid()
    and aa.status = 'active'
  limit 1;
$$;

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select current_admin_role() = 'super_admin';
$$;

create or replace function has_admin_permission(perm text)
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (
      select ar.permissions ? perm or ar.permissions ? 'all' or ar.name = 'super_admin'
      from admin_access aa
      join admin_roles ar on ar.id = aa.role_id
      where aa.user_id = auth.uid()
        and aa.status = 'active'
      limit 1
    ),
    false
  );
$$;

-- Auto-create a profile row whenever a new auth user is created.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, account_type)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(
      (new.raw_user_meta_data ->> 'account_type')::public.account_type,
      'pet_owner'::public.account_type
    )
  )
  on conflict (id) do nothing;

  -- If this email was pre-authorized as an admin, link the account up.
  update public.admin_access
  set user_id = new.id, updated_at = now()
  where email = new.email and user_id is null;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table pets enable row level security;
alter table admin_roles enable row level security;
alter table admin_access enable row level security;
alter table audit_logs enable row level security;
alter table vendors enable row level security;
alter table products enable row level security;
alter table apify_pet_data enable row level security;
alter table services enable row level security;
alter table comments enable row level security;
alter table reports enable row level security;
alter table saved_items enable row level security;
alter table price_alerts enable row level security;
alter table scraping_jobs enable row level security;
alter table blog_posts enable row level security;
alter table newsletter_subscribers enable row level security;
alter table categories enable row level security;
alter table countries enable row level security;
alter table languages enable row level security;
alter table cities enable row level security;

-- Reference data: readable by everyone, writable only by admins with content permission.
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);
drop policy if exists "admin write categories" on categories;
create policy "admin write categories" on categories for all
  using (has_admin_permission('categories.manage'))
  with check (has_admin_permission('categories.manage'));

drop policy if exists "public read countries" on countries;
create policy "public read countries" on countries for select using (true);
drop policy if exists "public read languages" on languages;
create policy "public read languages" on languages for select using (true);
drop policy if exists "public read cities" on cities;
create policy "public read cities" on cities for select using (true);

-- profiles: users manage their own row; admins with user permission can read all.
drop policy if exists "read own profile" on profiles;
create policy "read own profile" on profiles for select
  using (auth.uid() = id or has_admin_permission('users.manage'));
drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert
  with check (auth.uid() = id);

-- pets: owner-only
drop policy if exists "manage own pets" on pets;
create policy "manage own pets" on pets for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- admin_roles: readable by any authenticated admin; writable only by super admin
drop policy if exists "admins read roles" on admin_roles;
create policy "admins read roles" on admin_roles for select
  using (current_admin_role() is not null);
drop policy if exists "super admin writes roles" on admin_roles;
create policy "super admin writes roles" on admin_roles for all
  using (is_super_admin()) with check (is_super_admin());

-- admin_access: super admin full control; an admin can read their own row
drop policy if exists "super admin manages admin_access" on admin_access;
create policy "super admin manages admin_access" on admin_access for all
  using (is_super_admin()) with check (is_super_admin());
drop policy if exists "self read admin_access" on admin_access;
create policy "self read admin_access" on admin_access for select
  using (user_id = auth.uid());

-- audit_logs: any active admin can read; inserts happen via security-definer
-- functions/service role only (no direct client insert policy).
drop policy if exists "admins read audit logs" on audit_logs;
create policy "admins read audit logs" on audit_logs for select
  using (current_admin_role() is not null);

-- vendors: public sees verified vendors; owner sees/edits their own; admins with
-- vendors permission see/manage everything.
drop policy if exists "public read verified vendors" on vendors;
create policy "public read verified vendors" on vendors for select
  using (status = 'verified' or owner_id = auth.uid() or has_admin_permission('vendors.manage'));
drop policy if exists "vendor owner updates own listing" on vendors;
create policy "vendor owner updates own listing" on vendors for update
  using (owner_id = auth.uid() or has_admin_permission('vendors.manage'))
  with check (owner_id = auth.uid() or has_admin_permission('vendors.manage'));
drop policy if exists "vendor owner inserts listing" on vendors;
create policy "vendor owner inserts listing" on vendors for insert
  with check (owner_id = auth.uid() or has_admin_permission('vendors.manage'));
drop policy if exists "admin deletes vendor" on vendors;
create policy "admin deletes vendor" on vendors for delete
  using (has_admin_permission('vendors.manage'));

-- products: public sees active products on verified vendors; vendor owner and
-- admins with deals permission manage.
drop policy if exists "public read active products" on products;
create policy "public read active products" on products for select
  using (
    status = 'active'
    or has_admin_permission('deals.manage')
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

drop policy if exists "public read cached pet data" on apify_pet_data;
create policy "public read cached pet data" on apify_pet_data for select using (true);

drop policy if exists "vendor manages own products" on products;
create policy "vendor manages own products" on products for all
  using (
    has_admin_permission('deals.manage')
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  )
  with check (
    has_admin_permission('deals.manage')
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

-- services: same pattern as products, simpler (no status machine yet)
drop policy if exists "public read services" on services;
create policy "public read services" on services for select using (true);
drop policy if exists "vendor manages own services" on services;
create policy "vendor manages own services" on services for all
  using (
    has_admin_permission('vendors.manage')
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  )
  with check (
    has_admin_permission('vendors.manage')
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

-- comments: visible ones are public; authenticated users insert their own;
-- moderators/admins manage all.
drop policy if exists "public read visible comments" on comments;
create policy "public read visible comments" on comments for select
  using (status = 'visible' or user_id = auth.uid() or has_admin_permission('comments.manage'));
drop policy if exists "users post comments" on comments;
create policy "users post comments" on comments for insert
  with check (auth.uid() = user_id);
drop policy if exists "moderators manage comments" on comments;
create policy "moderators manage comments" on comments for update
  using (has_admin_permission('comments.manage'));
drop policy if exists "moderators delete comments" on comments;
create policy "moderators delete comments" on comments for delete
  using (has_admin_permission('comments.manage') or user_id = auth.uid());

-- reports: any authenticated user can file one; only moderators/admins read & act.
drop policy if exists "users file reports" on reports;
create policy "users file reports" on reports for insert
  with check (auth.uid() = reporter_id);
drop policy if exists "moderators read reports" on reports;
create policy "moderators read reports" on reports for select
  using (has_admin_permission('reports.manage') or reporter_id = auth.uid());
drop policy if exists "moderators update reports" on reports;
create policy "moderators update reports" on reports for update
  using (has_admin_permission('reports.manage'));

-- saved_items / price_alerts: owner-only
drop policy if exists "manage own saved items" on saved_items;
create policy "manage own saved items" on saved_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "manage own price alerts" on price_alerts;
create policy "manage own price alerts" on price_alerts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- scraping_jobs: operations admins/analysts only
drop policy if exists "admins read scraping jobs" on scraping_jobs;
create policy "admins read scraping jobs" on scraping_jobs for select
  using (has_admin_permission('scraper.manage') or has_admin_permission('analytics.view'));
drop policy if exists "admins manage scraping jobs" on scraping_jobs;
create policy "admins manage scraping jobs" on scraping_jobs for all
  using (has_admin_permission('scraper.manage'))
  with check (has_admin_permission('scraper.manage'));

-- blog_posts: public reads published; content admins manage all.
drop policy if exists "public read published posts" on blog_posts;
create policy "public read published posts" on blog_posts for select
  using (status = 'published' or has_admin_permission('content.manage'));
drop policy if exists "content admins manage posts" on blog_posts;
create policy "content admins manage posts" on blog_posts for all
  using (has_admin_permission('content.manage'))
  with check (has_admin_permission('content.manage'));

-- newsletter_subscribers: insert-only for anonymous signup; admins manage.
drop policy if exists "anyone can subscribe" on newsletter_subscribers;
create policy "anyone can subscribe" on newsletter_subscribers for insert
  with check (true);
drop policy if exists "admins manage subscribers" on newsletter_subscribers;
create policy "admins manage subscribers" on newsletter_subscribers for select
  using (has_admin_permission('communications.manage'));
drop policy if exists "admins update subscribers" on newsletter_subscribers;
create policy "admins update subscribers" on newsletter_subscribers for update
  using (has_admin_permission('communications.manage'));

-- ============================================================================
-- PHASE 3 MIGRATION — safe to re-run even if you already ran this file before
-- ============================================================================
-- products.source_url needs a unique constraint so the scraper can upsert by
-- URL (`onConflict: "source_url"`) instead of creating duplicate rows every
-- time it re-checks a listing.
-- A unique index is sufficient for PostgreSQL/Supabase `ON CONFLICT` inference.
-- Unlike an exception block around ADD CONSTRAINT, IF NOT EXISTS also handles
-- SQLSTATE 42P07 when the constraint's backing index already exists.
create unique index if not exists products_source_url_key on products(source_url);

-- ============================================================================
-- PHASE 5 MIGRATION — Vendor Dashboard support (analytics, messaging,
-- deal provenance). Also safe to re-run.
-- ============================================================================

do $$ begin
  create type product_source as enum ('scraped', 'vendor_submitted');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table products add column source product_source not null default 'scraped';
exception when duplicate_column then null; end $$;

-- Referral/engagement funnel tracking for the "Vendor Analytics" section of
-- the spec (Profile Views, Website Clicks, Phone/Contact Clicks, Directions
-- Requested). Fired from the public vendor profile page.
create table if not exists vendor_events (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  event_type text not null, -- profile_view | website_click | contact_click | directions_click
  created_at timestamptz not null default now()
);
create index if not exists idx_vendor_events_vendor on vendor_events(vendor_id, event_type);

alter table vendor_events enable row level security;

drop policy if exists "anyone can log a vendor event" on vendor_events;
create policy "anyone can log a vendor event" on vendor_events for insert
  with check (true);

drop policy if exists "vendor owner reads own events" on vendor_events;
create policy "vendor owner reads own events" on vendor_events for select
  using (
    has_admin_permission('vendors.manage')
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

-- Private "Contact Vendor" inquiries (spec section 14) — distinct from the
-- public `comments` table, which is for visible pet-owner feedback.
create table if not exists vendor_messages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_vendor_messages_vendor on vendor_messages(vendor_id, created_at desc);

alter table vendor_messages enable row level security;

drop policy if exists "sender sends message" on vendor_messages;
create policy "sender sends message" on vendor_messages for insert
  with check (auth.uid() = sender_id);

drop policy if exists "sender and vendor owner read messages" on vendor_messages;
create policy "sender and vendor owner read messages" on vendor_messages for select
  using (
    auth.uid() = sender_id
    or has_admin_permission('vendors.manage')
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

drop policy if exists "vendor owner marks messages read" on vendor_messages;
create policy "vendor owner marks messages read" on vendor_messages for update
  using (
    has_admin_permission('vendors.manage')
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid())
  );

-- Minimal admin bridge (full Vendors admin section is Phase 6): any active
-- admin can see and act on pending vendor-submitted listings.
drop policy if exists "admins update vendor status" on vendors;
create policy "admins update vendor status" on vendors for update
  using (current_admin_role() is not null)
  with check (current_admin_role() is not null);

-- ============================================================================
-- PHASE 6 MIGRATION — Full-ish Admin Panel (vendor/deal management, reports,
-- comments moderation, user suspension, audit logging). Also safe to re-run.
-- ============================================================================

do $$ begin
  alter table profiles add column status text not null default 'active';
exception when duplicate_column then null; end $$;

-- Admins with the users permission can suspend/reactivate a pet owner or
-- vendor account (in addition to the existing self-update policy).
drop policy if exists "admins update profiles" on profiles;
create policy "admins update profiles" on profiles for update
  using (has_admin_permission('users.manage'))
  with check (has_admin_permission('users.manage'));

-- Admin actions (vendor approval, deal moderation, report resolution, etc.)
-- now write directly to audit_logs using the acting admin's own session —
-- Phase 2 only had a SELECT policy here, so inserts need one too.
drop policy if exists "admins write audit logs" on audit_logs;
create policy "admins write audit logs" on audit_logs for insert
  with check (current_admin_role() is not null);
