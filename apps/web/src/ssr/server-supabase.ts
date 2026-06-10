import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

const PLACEHOLDER_URL = "http://127.0.0.1:54321";
const PLACEHOLDER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

type StagedSsrEnv = {
  supabaseUrl?: string;
  supabaseKey?: string;
};

function readEnv(name: string): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess;
  return undefined;
}

function readStagedEnv(): StagedSsrEnv {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const path = join(dir, "env.json");
    if (!existsSync(path)) return {};
    return JSON.parse(readFileSync(path, "utf8")) as StagedSsrEnv;
  } catch {
    return {};
  }
}

function isLocalhostUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/.test(url);
}

export function createServerSupabase(): SupabaseClient<Database> {
  const staged = readStagedEnv();
  const url =
    readEnv("VITE_SUPABASE_URL") ??
    readEnv("SUPABASE_URL") ??
    staged.supabaseUrl?.trim() ??
    PLACEHOLDER_URL;
  const key =
    readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ??
    readEnv("SUPABASE_ANON_KEY") ??
    staged.supabaseKey?.trim() ??
    PLACEHOLDER_KEY;

  if (isLocalhostUrl(url) && process.env.VERCEL === "1") {
    throw new Error(
      "SSR Supabase is not configured on Vercel. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for production builds.",
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
