import postgres from "postgres";

/** Builds a direct Postgres connection string from the same env vars the
 * Supabase JS client uses (SUPABASE_URL) plus the DB password Supabase
 * doesn't expose via its API client (SUPABASE_DB_PASSWORD). Used by
 * anything that needs raw SQL access — the Supabase JS client only exposes
 * `.from()`/`.storage`, not DDL. */
export function createDbConnection() {
  const url = process.env.SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!url || !dbPassword) {
    throw new Error("SUPABASE_URL and SUPABASE_DB_PASSWORD must be set");
  }
  const projectRef = new URL(url).hostname.split(".")[0];
  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
  return postgres(connectionString, { ssl: "require" });
}
