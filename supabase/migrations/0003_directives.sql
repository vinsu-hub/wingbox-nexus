-- Compliance directives (AD/SB) and their per-aircraft compliance status.
-- directive_compliance_records.status mirrors the UI's existing per-tail
-- status contract (Compliant/Due Soon/Overdue/N-A) directly, since that's
-- what ComplianceView.tsx already renders per affected aircraft.
create table if not exists directives (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('AD', 'SB')),
  reference_no text not null,
  title text not null,
  applicability text,
  issuing_authority text,
  effective_date date,
  compliance_due date,
  status text not null default 'open' check (status in ('open', 'in_progress', 'complied', 'not_applicable')),
  ata_chapter text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists directive_compliance_records (
  id uuid primary key default gen_random_uuid(),
  directive_id uuid not null references directives(id) on delete cascade,
  tail_number text not null references aircraft(tail_number),
  status text not null check (status in ('Compliant', 'Due Soon', 'Overdue', 'N/A')),
  complied_date date,
  complied_by text,
  signed_off_by text,
  reference_doc_url text,
  created_at timestamptz not null default now(),
  unique (directive_id, tail_number)
);
create index if not exists directive_compliance_records_directive_idx on directive_compliance_records (directive_id);
create index if not exists directive_compliance_records_tail_idx on directive_compliance_records (tail_number);
