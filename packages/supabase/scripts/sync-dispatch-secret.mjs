#!/usr/bin/env node
/**
 * Copies PLUGIN_SYNC_DISPATCH_SECRET into private.worker_config so pg_cron can
 * invoke plugin-sync-dispatch. Optionally updates plugin_sync_functions_base.
 *
 * Local: reads secret from packages/supabase/supabase/functions/.env
 * Production: configure Edge Function secrets + private.worker_config manually (see README).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "supabase", "functions", ".env");

function escapeSqlLiteral(value) {
  return value.replace(/'/g, "''");
}

function readSecretFromEnvFile() {
  if (!fs.existsSync(envPath)) return null;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^PLUGIN_SYNC_DISPATCH_SECRET=(.*)$/);
    if (!match) continue;
    const value = match[1].trim().replace(/^['"]|['"]$/g, "");
    if (value) return value;
  }
  return null;
}

function resolveSecret() {
  const fromEnv = process.env.PLUGIN_SYNC_DISPATCH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  const fromFile = readSecretFromEnvFile();
  if (fromFile) return fromFile;
  console.error(
    "sync-dispatch-secret: set PLUGIN_SYNC_DISPATCH_SECRET or add it to packages/supabase/supabase/functions/.env",
  );
  process.exit(1);
}

function resolveFunctionsBase() {
  const explicit = process.env.PLUGIN_SYNC_FUNCTIONS_BASE?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
  }

  return null;
}

function runSql(sql) {
  const result = spawnSync("supabase", ["db", "query", sql], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const secret = resolveSecret();
runSql(
  `update private.worker_config set value = '${escapeSqlLiteral(secret)}' where key = 'plugin_sync_dispatch_secret';`,
);
console.log(
  "sync-dispatch-secret: updated private.worker_config.plugin_sync_dispatch_secret",
);

const functionsBase = resolveFunctionsBase();
if (functionsBase) {
  runSql(
    `update private.worker_config set value = '${escapeSqlLiteral(functionsBase)}' where key = 'plugin_sync_functions_base';`,
  );
  console.log(
    "sync-dispatch-secret: updated private.worker_config.plugin_sync_functions_base",
  );
}
