import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set (see .env.example)");
}

export const MODELS_BUCKET = "models";
export const MODELS_TABLE = "models";

export const supabase = createClient(url, secretKey, {
  auth: { persistSession: false },
});
