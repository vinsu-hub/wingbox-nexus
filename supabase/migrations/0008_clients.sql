-- Multi-tenancy: introduce clients as the tenancy boundary and backfill
-- client_id onto every table that holds one client's business data.
--
-- Scoping decision, recorded here since it's not obvious from the table
-- list alone: client_id is added to aircraft and everything that is
-- genuinely per-aircraft business data (components, component_life_limits,
-- directive_compliance_records, delivery_events, delivery_discrepancies).
-- It is deliberately NOT added to:
--   - directives            regulatory reference data (an AD/SB can apply
--                           to more than one operator's aircraft of the
--                           same type) — directive_compliance_records is
--                           the per-aircraft, per-client join and IS scoped.
--   - qc_checklist_templates  shared org-wide templates, not tenant data.
--   - models                 shared 3D reference asset, not tenant data.
--   - audit_events           cross-client system log; the Audit Log page
--                           is Admin/QA-only (server/lib/auth.ts), never
--                           exposed to the Client role, so it does not need
--                           row-level client scoping to satisfy "a Client
--                           user cannot read another client's rows".
-- qc_checklist_instances gets a nullable client_id: populated where it's
-- derivable today (linked to a real aircraft or delivery_event), left null
-- for inspection/part_request-linked instances since those remain
-- mock-only modules with no real table to join through yet.
--
-- Backfill creates one clients row per distinct aircraft.client text value
-- already in the fleet data (Skyline Air, Island Wings, Pacific Horizon,
-- SkyWays Airlines, ...) rather than one single blob "demo client" — these
-- are already real, distinct tenant identities in the existing data (the
-- Client Access demo page is literally scoped to one of them, "Skyline
-- Air"). Every backfilled row is flagged is_demo = true, since all of
-- today's data is seed/demo data regardless of tenant identity.

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

-- aircraft.client (free text, e.g. "Skyline Air") is kept as the display
-- name; client_id is the real FK used for scoping. They should always
-- agree — enforcement of that is an application-level concern (aircraft
-- has no CRUD UI yet per 0001's own comment), not a DB constraint here.
alter table aircraft add column if not exists client_id uuid references clients(id);

insert into clients (name, is_demo)
select distinct client, true from aircraft
on conflict (name) do nothing;

update aircraft set client_id = clients.id
from clients
where aircraft.client = clients.name and aircraft.client_id is null;

alter table aircraft alter column client_id set not null;
create index if not exists aircraft_client_idx on aircraft (client_id);

-- profiles.client_id: which tenant a Client-role user belongs to. Null for
-- internal roles (Engineer/Planner/QA/Admin), who work across all clients.
-- This is what the server-side scoping helper (server/lib/clientScope.ts)
-- reads to decide whether and how to filter a request.
alter table profiles add column if not exists client_id uuid references clients(id);
create index if not exists profiles_client_idx on profiles (client_id) where client_id is not null;

alter table components add column if not exists client_id uuid references clients(id);
update components set client_id = aircraft.client_id
from aircraft
where components.aircraft_tail = aircraft.tail_number and components.client_id is null;
alter table components alter column client_id set not null;
create index if not exists components_client_idx on components (client_id);

alter table component_life_limits add column if not exists client_id uuid references clients(id);
update component_life_limits set client_id = components.client_id
from components
where component_life_limits.component_id = components.id and component_life_limits.client_id is null;
alter table component_life_limits alter column client_id set not null;
create index if not exists component_life_limits_client_idx on component_life_limits (client_id);

alter table directive_compliance_records add column if not exists client_id uuid references clients(id);
update directive_compliance_records set client_id = aircraft.client_id
from aircraft
where directive_compliance_records.tail_number = aircraft.tail_number and directive_compliance_records.client_id is null;
alter table directive_compliance_records alter column client_id set not null;
create index if not exists directive_compliance_records_client_idx on directive_compliance_records (client_id);

alter table delivery_events add column if not exists client_id uuid references clients(id);
update delivery_events set client_id = aircraft.client_id
from aircraft
where delivery_events.aircraft_tail = aircraft.tail_number and delivery_events.client_id is null;
alter table delivery_events alter column client_id set not null;
create index if not exists delivery_events_client_idx on delivery_events (client_id);

alter table delivery_discrepancies add column if not exists client_id uuid references clients(id);
update delivery_discrepancies set client_id = delivery_events.client_id
from delivery_events
where delivery_discrepancies.delivery_event_id = delivery_events.id and delivery_discrepancies.client_id is null;
alter table delivery_discrepancies alter column client_id set not null;
create index if not exists delivery_discrepancies_client_idx on delivery_discrepancies (client_id);

-- Nullable: see comment at top of file.
alter table qc_checklist_instances add column if not exists client_id uuid references clients(id);
update qc_checklist_instances set client_id = aircraft.client_id
from aircraft
where qc_checklist_instances.linked_entity_type = 'aircraft'
  and qc_checklist_instances.linked_entity_id = aircraft.tail_number
  and qc_checklist_instances.client_id is null;
update qc_checklist_instances set client_id = delivery_events.client_id
from delivery_events
where qc_checklist_instances.linked_entity_type = 'delivery'
  and qc_checklist_instances.linked_entity_id = delivery_events.id::text
  and qc_checklist_instances.client_id is null;
create index if not exists qc_checklist_instances_client_idx on qc_checklist_instances (client_id) where client_id is not null;
