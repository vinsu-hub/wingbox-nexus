-- Action tracker: one shared table for audit corrective actions, gap
-- follow-up, redelivery items, discrepancy resolution, occurrence
-- follow-up, etc. (see the master build prompt's "Shared building blocks").
-- client_id is nullable: an action can be genuinely internal/fleet-wide
-- (e.g. a housekeeping task with no single owning aircraft/client), in
-- which case it's staff-only by construction (same visibility rule as
-- qc_checklist_instances' nullable client_id).
create table if not exists actions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  subject_type text not null,
  subject_id text not null,
  title text not null,
  description text,
  owner_id uuid references profiles(id),
  due_date date,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  source_type text,
  source_id text,
  closed_by uuid references profiles(id),
  closed_at timestamptz,
  closure_note text,
  evidence_document_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists actions_client_idx on actions (client_id) where client_id is not null;
create index if not exists actions_status_idx on actions (status);
create index if not exists actions_subject_idx on actions (subject_type, subject_id);

-- Review Inbox skeleton: one queue/screen for extractions, entity-link
-- proposals, predictions, AI defect suggestions, reconciliation mismatches
-- — every later phase's "AI proposed this, a person must accept or reject
-- it" surface lands here. No producer writes to this table yet in
-- Foundations; the table and API exist so later phases only add a `kind`,
-- not new plumbing.
create table if not exists review_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  kind text not null,
  subject_type text not null,
  subject_id text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists review_items_client_idx on review_items (client_id) where client_id is not null;
create index if not exists review_items_kind_status_idx on review_items (kind, status);
