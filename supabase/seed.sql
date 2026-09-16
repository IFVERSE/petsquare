-- ============================================================================
-- PetSquare — Phase 2 Reference Data Seed
-- Run this AFTER schema.sql. Safe to re-run (uses ON CONFLICT DO NOTHING).
-- ============================================================================

-- Countries (initial directory coverage from the spec)
insert into countries (code, name, currency) values
  ('RO', 'Romania', 'RON'),
  ('PL', 'Poland', 'PLN'),
  ('CZ', 'Czechia', 'CZK'),
  ('HU', 'Hungary', 'HUF'),
  ('DE', 'Germany', 'EUR'),
  ('GB', 'United Kingdom', 'GBP'),
  ('FR', 'France', 'EUR'),
  ('IT', 'Italy', 'EUR'),
  ('ES', 'Spain', 'EUR'),
  ('AT', 'Austria', 'EUR'),
  ('SE', 'Sweden', 'SEK'),
  ('PT', 'Portugal', 'EUR')
on conflict (code) do nothing;

-- Languages
insert into languages (code, name, native_name) values
  ('ro', 'Romanian', 'Română'),
  ('pl', 'Polish', 'Polski'),
  ('cs', 'Czech', 'Čeština'),
  ('hu', 'Hungarian', 'Magyar'),
  ('de', 'German', 'Deutsch'),
  ('en', 'English', 'English'),
  ('fr', 'French', 'Français'),
  ('it', 'Italian', 'Italiano'),
  ('es', 'Spanish', 'Español'),
  ('pt', 'Portuguese', 'Português')
on conflict (code) do nothing;

-- Product categories
insert into categories (type, slug, name, emoji, sort_order) values
  ('product', 'consumables', 'Consumables', '🍖', 1),
  ('product', 'gear', 'Gear & Wearables', '🦴', 2),
  ('product', 'housing', 'Housing & Bedding', '🏠', 3),
  ('product', 'hygiene', 'Hygiene & Waste', '🧼', 4),
  ('product', 'enrichment', 'Enrichment & Training', '🧸', 5)
on conflict (type, slug) do nothing;

-- Service categories
insert into categories (type, slug, name, emoji, sort_order) values
  ('service', 'medical', 'Medical & Wellness', '🏥', 1),
  ('service', 'grooming', 'Grooming & Aesthetics', '✂️', 2),
  ('service', 'care', 'Care & Lodging', '🏨', 3),
  ('service', 'behavior', 'Behavior & Education', '🎓', 4),
  ('service', 'memorial', 'End-of-Life & Memorial Services', '🕊️', 5)
on conflict (type, slug) do nothing;

-- Species categories
insert into categories (type, slug, name, emoji, sort_order) values
  ('species', 'dog', 'Dogs (Canine)', '🐶', 1),
  ('species', 'cat', 'Cats (Feline)', '🐱', 2),
  ('species', 'bird', 'Birds (Avian)', '🐦', 3),
  ('species', 'fish', 'Aquatic (Fish)', '🐟', 4),
  ('species', 'exotic', 'Exotics & Small Mammals', '🐰', 5)
on conflict (type, slug) do nothing;

-- ============================================================================
-- Admin roles & permissions (RBAC)
-- ============================================================================
-- Permission strings are checked against admin_roles.permissions (jsonb array)
-- by the has_admin_permission() function in schema.sql. 'super_admin' bypasses
-- all checks via is_super_admin().

insert into admin_roles (name, label, permissions, is_system) values
  ('super_admin', 'Super Admin', '["all"]', true),
  ('operations_admin', 'Operations Admin', '["vendors.manage","deals.manage","categories.manage","scraper.manage"]', true),
  ('content_admin', 'Content Admin', '["content.manage","communications.manage"]', true),
  ('support_admin', 'Support Admin', '["users.manage","reports.manage","communications.manage"]', true),
  ('moderator', 'Moderator', '["comments.manage","reports.manage"]', true),
  ('analyst', 'Analyst', '["analytics.view"]', true)
on conflict (name) do nothing;
