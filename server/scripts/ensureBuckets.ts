// Idempotently ensures a private Supabase Storage bucket exists.
// Run directly with: pnpm tsx server/scripts/ensureBuckets.ts <bucket-name> [<bucket-name> ...]
import "dotenv/config";
import { pathToFileURL } from "url";
import { supabase } from "../lib/supabase.js";

export async function ensureBucket(name: string): Promise<void> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets.some(bucket => bucket.name === name)) {
    console.log(`storage bucket "${name}" already exists`);
    return;
  }
  const { error: createError } = await supabase.storage.createBucket(name, { public: false });
  if (createError) throw createError;
  console.log(`storage bucket "${name}" created`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const names = process.argv.slice(2);
  if (names.length === 0) {
    console.error("Usage: pnpm tsx server/scripts/ensureBuckets.ts <bucket-name> [<bucket-name> ...]");
    process.exit(1);
  }
  Promise.all(names.map(ensureBucket))
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
