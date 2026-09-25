// Applies pending SQL files under supabase/migrations/, tracked in a
// schema_migrations table so each file runs at most once per database.
// Run with: pnpm migrate
// Preview without applying anything: pnpm migrate -- --dry-run
import "dotenv/config";
import { readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createDbConnection } from "../lib/dbConnection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(name => name.endsWith(".sql"))
    .sort();

  const sql = createDbConnection();
  try {
    await sql`
      create table if not exists schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )
    `;

    const appliedRows = await sql<{ filename: string }[]>`select filename from schema_migrations`;
    const applied = new Set(appliedRows.map(row => row.filename));
    const pending = files.filter(name => !applied.has(name));

    if (pending.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    if (dryRun) {
      console.log("Pending migrations (dry run, nothing applied):");
      pending.forEach(name => console.log(`  ${name}`));
      return;
    }

    for (const name of pending) {
      const contents = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
      console.log(`Applying ${name}...`);
      await sql.begin(async tx => {
        await tx.unsafe(contents);
        await tx`insert into schema_migrations (filename) values (${name})`;
      });
      console.log(`Applied ${name}`);
    }
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
