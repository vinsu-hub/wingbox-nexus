-- QA/QC checklist templates and the instances technicians work through.
-- linked_entity_id is plain text, not a FK: inspections and parts requests
-- are still mock-only modules with no real tables to reference yet.
create table if not exists qc_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('inspection', 'parts', 'delivery')),
  items jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists qc_checklist_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references qc_checklist_templates(id),
  linked_entity_type text not null check (linked_entity_type in ('inspection', 'part_request', 'aircraft', 'delivery')),
  linked_entity_id text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'passed', 'failed')),
  completed_by text,
  completed_at timestamptz,
  results jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists qc_checklist_instances_linked_idx on qc_checklist_instances (linked_entity_type, linked_entity_id);
