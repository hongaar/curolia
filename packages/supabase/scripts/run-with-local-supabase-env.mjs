#!/usr/bin/env node
import { spawnSync } from "node:child_process";

import { applyLocalSupabaseEnv } from "./load-local-supabase-env.mjs";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error(
    "Usage: node scripts/run-with-local-supabase-env.mjs <command> [args…]",
  );
  process.exit(1);
}

try {
  applyLocalSupabaseEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
