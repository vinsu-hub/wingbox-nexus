// One-time setup: creates the `models` table and Storage bucket in Supabase.
// Run with: pnpm tsx server/scripts/provisionModels.ts
import "dotenv/config";
import postgres from "postgres";
import { supabase, MODELS_BUCKET } from "../lib/supabase.js";

async function main() {
  const url = process.env.SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!url || !dbPassword) {
    throw new Error("SUPABASE_URL and SUPABASE_DB_PASSWORD must be set");
  }
  const projectRef = new URL(url).hostname.split(".")[0];
  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

  const sql = postgres(connectionString, { ssl: "require" });
  try {
    await sql`
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
      )
    `;
    console.log("models table ready");
  } finally {
    await sql.end();
  }

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (!buckets.some(bucket => bucket.name === MODELS_BUCKET)) {
    const { error: createError } = await supabase.storage.createBucket(MODELS_BUCKET, {
      public: false,
    });
    if (createError) throw createError;
    console.log(`storage bucket "${MODELS_BUCKET}" created`);
  } else {
    console.log(`storage bucket "${MODELS_BUCKET}" already exists`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
