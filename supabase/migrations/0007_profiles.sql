-- App-level profile for each Supabase Auth user. auth.users isn't meant to
-- carry app columns, so role and display name live here, keyed by the same id.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('Engineer', 'Planner', 'QA', 'Admin', 'Client')),
  display_name text not null,
  created_at timestamptz not null default now()
);
