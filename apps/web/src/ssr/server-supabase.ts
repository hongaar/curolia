import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

const PLACEHOLDER_URL = "http://127.0.0.1:54321";
const PLACEHOLDER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

function readEnv(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;
  return undefined;
}

export function createServerSupabase(): SupabaseClient<Database> {
  const url =
    readEnv("VITE_SUPABASE_URL") ?? readEnv("SUPABASE_URL") ?? PLACEHOLDER_URL;
  const key =
    readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ??
    readEnv("SUPABASE_ANON_KEY") ??
    PLACEHOLDER_KEY;

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
