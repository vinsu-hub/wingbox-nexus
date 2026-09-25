-- Append-only log of sign-off/status-change actions across Wave 1 modules.
-- Written by server/lib/auditLog.ts; no UI reads this yet (that's Wave 2's
-- Audit Log page, item 2.5) — this just makes sure the data exists.
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  before_state jsonb,
  after_state jsonb,
  "timestamp" timestamptz not null default now()
);
create index if not exists audit_events_entity_idx on audit_events (entity_type, entity_id);
create index if not exists audit_events_timestamp_idx on audit_events ("timestamp");
