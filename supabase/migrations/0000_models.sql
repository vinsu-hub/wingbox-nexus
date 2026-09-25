-- Folded in from the original provisionModels.ts one-off script so migration
-- history is complete from the start. This table already exists in the live
-- database; `if not exists` keeps this idempotent for a fresh environment.
create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  source text not null,
  license_note text,
  node_count int not null default 0,
  triangle_count int not null default 0,
  is_separable boolean not null default false,
  linked_component_id text,
  linked_finding_id text,
  created_at timestamptz not null default now()
);
