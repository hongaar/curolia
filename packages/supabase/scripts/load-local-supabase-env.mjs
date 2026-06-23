import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const supabasePackageDir = path.resolve(scriptDir, "..");

/** @returns {Record<string, string>} */
export function parseSupabaseStatusEnv(stdout) {
  /** @type {Record<string, string>} */
  const env = {};
  for (const line of stdout.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/** @returns {Record<string, string>} */
export function loadLocalSupabaseEnv() {
  const hasCore =
    process.env.SUPABASE_URL?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  let status = null;
  const readStatus = () => {
    if (status) return status;
    let stdout;
    try {
      stdout = execSync("npx supabase status -o env", {
        cwd: supabasePackageDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      if (hasCore) {
        return null;
      }
      const stderr =
        error && typeof error === "object" && "stderr" in error
          ? String(error.stderr)
          : "";
      throw new Error(
        [
          "Could not read local Supabase credentials.",
          "Start the stack with: npm run db:start -w @curolia/supabase",
          "Or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.",
          stderr.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
    status = parseSupabaseStatusEnv(stdout);
    return status;
  };

  if (hasCore) {
    const parsed = readStatus();
    const supabaseUrl = process.env.SUPABASE_URL.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
    const apiUrl = process.env.VITE_SUPABASE_URL?.trim() ?? supabaseUrl;
    const anonKey =
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ??
      parsed?.ANON_KEY?.trim() ??
      "";
    return {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      VITE_SUPABASE_URL: apiUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: anonKey,
    };
  }

  const parsed = readStatus();
  if (!parsed) {
    throw new Error("Could not read local Supabase credentials.");
  }

  const apiUrl = parsed.API_URL?.trim();
  const serviceRoleKey = parsed.SERVICE_ROLE_KEY?.trim();
  const anonKey = parsed.ANON_KEY?.trim();

  if (!apiUrl || !serviceRoleKey) {
    throw new Error(
      [
        "Local Supabase is running but status did not return API_URL / SERVICE_ROLE_KEY.",
        "Try: npm run db:status -w @curolia/supabase",
      ].join("\n"),
    );
  }

  if (!anonKey) {
    throw new Error(
      "Local Supabase status did not return ANON_KEY for VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    SUPABASE_URL: apiUrl,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    VITE_SUPABASE_URL: apiUrl,
    VITE_SUPABASE_PUBLISHABLE_KEY: anonKey,
  };
}

/** Merge local Supabase env into `process.env` (no-op when already set). */
export function applyLocalSupabaseEnv() {
  const loaded = loadLocalSupabaseEnv();
  for (const [key, value] of Object.entries(loaded)) {
    if (!value) {
      throw new Error(
        `Missing ${key} after loading local Supabase credentials.`,
      );
    }
    process.env[key] = value;
  }
  return loaded;
}
