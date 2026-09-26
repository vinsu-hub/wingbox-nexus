-- Aircraft delivery / lease-return (redelivery) events. Each event gets a
-- records-completeness QA/QC checklist (category 'delivery') and a log of
-- discrepancies against the return condition.
-- status is derived server-side from sign-off + open discrepancies, never
-- written directly by clients.
create table if not exists delivery_events (
  id uuid primary key default gen_random_uuid(),
  aircraft_tail text not null references aircraft(tail_number),
  event_type text not null check (event_type in ('delivery', 'redelivery')),
  counterparty text not null,
  target_date date not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'discrepancies_open', 'complete')),
  qc_checklist_instance_id uuid references qc_checklist_instances(id),
  signed_off_by text,
  signed_off_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists delivery_events_tail_idx on delivery_events (aircraft_tail);

-- linked_finding_id is text with no FK: findings are still mock-only
-- (IDs like "F-02"); a real findings table arrives in Wave 2 (item 2.1).
create table if not exists delivery_discrepancies (
  id uuid primary key default gen_random_uuid(),
  delivery_event_id uuid not null references delivery_events(id) on delete cascade,
  description text not null,
  linked_compliance_directive_id uuid references directives(id) on delete set null,
  linked_finding_id text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  raised_by text not null,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists delivery_discrepancies_event_idx on delivery_discrepancies (delivery_event_id);
