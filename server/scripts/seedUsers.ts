// Creates one demo account per role (Supabase Auth user + matching profile).
// Auth users can't be inserted with raw SQL — they go through the admin API.
// The shared password comes from SEED_USER_PASSWORD in .env, never the repo.
// Run with: pnpm seed:users   (idempotent — existing accounts are updated)
import "dotenv/config";
import { supabase } from "../lib/supabase.js";
import { PROFILES_TABLE, type Role } from "../lib/auth.js";

const DEMO_USERS: { email: string; role: Role; displayName: string; clientName?: string }[] = [
  { email: "admin@wingbox.aero", role: "Admin", displayName: "Alex Admin" },
  { email: "engineer@wingbox.aero", role: "Engineer", displayName: "John Dela Cruz" },
  { email: "planner@wingbox.aero", role: "Planner", displayName: "Paula Planner" },
  { email: "qa@wingbox.aero", role: "QA", displayName: "Elena Santos" },
  { email: "client@wingbox.aero", role: "Client", displayName: "Skyline Air (Client)", clientName: "Skyline Air" },
  // A second Client-role account tied to a different tenant, purely so
  // cross-client scoping has two real accounts to test against — see
  // server/routes/*.clientScope.test.ts.
  { email: "client2@wingbox.aero", role: "Client", displayName: "Island Wings (Client)", clientName: "Island Wings" },
];

async function main() {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Set SEED_USER_PASSWORD (12+ characters) in .env before seeding users.");
  }

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listError) throw listError;

  const { data: clients, error: clientsError } = await supabase.from("clients").select("id, name");
  if (clientsError) throw clientsError;
  const clientIdByName = new Map((clients ?? []).map(c => [c.name, c.id as string]));

  for (const demo of DEMO_USERS) {
    const clientId = demo.clientName ? clientIdByName.get(demo.clientName) : undefined;
    if (demo.clientName && !clientId) {
      throw new Error(`No clients row named "${demo.clientName}" — run pnpm migrate first.`);
    }
    let userId = existing.users.find(user => user.email === demo.email)?.id;
    if (userId) {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({ email: demo.email, password, email_confirm: true });
      if (error) throw error;
      userId = data.user.id;
    }
    const { error: profileError } = await supabase
      .from(PROFILES_TABLE)
      .upsert({ id: userId, email: demo.email, role: demo.role, display_name: demo.displayName, client_id: clientId ?? null });
    if (profileError) throw profileError;
    console.log(`${demo.role.padEnd(8)} ${demo.email}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
