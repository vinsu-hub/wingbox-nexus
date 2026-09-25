-- Minimal FK-anchor table — every Wave 1 table added after this one
-- references a tail number. Not a full aircraft CRUD module; the richer
-- fleet fields (hours, cycles, compliance %, etc.) stay in
-- client/src/data/aircraft.ts as mock data for now.
create table if not exists aircraft (
  tail_number text primary key,
  type text not null,
  client text not null,
  status text not null check (status in ('Active', 'In Inspection', 'Attention')),
  created_at timestamptz not null default now()
);
