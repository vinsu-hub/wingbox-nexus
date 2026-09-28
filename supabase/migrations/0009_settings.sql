-- Fleet-wide configuration, editable at runtime instead of hardcoded.
-- Foundations phase: "Real System Settings backed by a settings table (key,
-- value jsonb, updated_by). First settings: life-tracking Due Soon
-- percentage (default 80), approaching threshold (default 10), overdue
-- (default 100). Audited."
-- Not client-scoped: these are WingBox's own fleet-wide operating
-- thresholds, not one tenant's business data.
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values
  ('life_tracking.approaching_threshold_pct', '10'),
  ('life_tracking.due_soon_used_pct', '80'),
  ('life_tracking.overdue_used_pct', '100')
on conflict (key) do nothing;
