import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_APP_VERSION = "dev";

/**
 * Release version for web, Android, and iOS.
 * Production CI sets APP_VERSION; local builds use DEFAULT_APP_VERSION.
 */
export function resolveAppVersion(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const fromEnv = env.APP_VERSION?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  return DEFAULT_APP_VERSION;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${resolveAppVersion()}\n`);
}
