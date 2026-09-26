-- Life-limited components and their hours / cycles / calendar limits.
-- A component can carry several limit types at once; whichever has the
-- least remaining margin is the binding constraint (computed server-side in
-- server/lib/lifeTracking.ts, never stored).
-- calendar_months limits derive usage from components.install_date at query
-- time, so their current_value column is unused (kept at 0).
create table if not exists components (
  id uuid primary key default gen_random_uuid(),
  aircraft_tail text not null references aircraft(tail_number),
  part_number text not null,
  serial_number text not null,
  description text not null,
  ata_chapter text,
  install_date date not null,
  created_at timestamptz not null default now(),
  unique (part_number, serial_number)
);
create index if not exists components_tail_idx on components (aircraft_tail);

create table if not exists component_life_limits (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null references components(id) on delete cascade,
  limit_type text not null check (limit_type in ('hours', 'cycles', 'calendar_months')),
  limit_value numeric not null check (limit_value > 0),
  current_value numeric not null default 0 check (current_value >= 0),
  last_updated timestamptz not null default now(),
  acknowledged_by text,
  acknowledged_at timestamptz,
  unique (component_id, limit_type)
);
