import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { resolveSupabaseUrl } from "./resolve-supabase-url";

export type { Database } from "./database.types";

/** Local Supabase default; overridden in production via `.env`. */
const PLACEHOLDER_URL = "http://127.0.0.1:54321";
/** Supabase CLI demo anon JWT — only used when env vars are unset (e.g. CI smoke tests). */
const PLACEHOLDER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

/** Platform-resolved Supabase project base URL. Re-exported for callers that need to build public Edge Function URLs. */
export const supabaseUrl = resolveSupabaseUrl(
  import.meta.env.VITE_SUPABASE_URL || PLACEHOLDER_URL,
);
const url = supabaseUrl;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || PLACEHOLDER_KEY;

if (
  !import.meta.env.VITE_SUPABASE_URL ||
  !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — using local placeholders until you add apps/web/.env",
  );
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
