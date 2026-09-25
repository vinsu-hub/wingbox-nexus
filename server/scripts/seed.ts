// Idempotent demo-data seeding, separate from schema migrations (supabase/migrations/)
// since this is data, not structure. Safe to re-run — every insert upserts by
// primary/natural key. Run with: pnpm seed
import "dotenv/config";
import { createDbConnection } from "../lib/dbConnection.js";
import { aircraft } from "../../client/src/data/aircraft.js";

async function seedAircraft(sql: ReturnType<typeof createDbConnection>) {
  for (const a of aircraft) {
    await sql`
      insert into aircraft (tail_number, type, client, status)
      values (${a.tail}, ${a.type}, ${a.client}, ${a.status})
      on conflict (tail_number) do update set type = excluded.type, client = excluded.client, status = excluded.status
    `;
  }
  console.log(`aircraft: seeded ${aircraft.length} rows`);
}

async function main() {
  const sql = createDbConnection();
  try {
    await seedAircraft(sql);
    // Wave 1 items 1.2 (directives), 1.3 (qc_checklist_templates), and 1.5
    // (components) add their own seed functions here as their tables land.
  } finally {
    await sql.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
