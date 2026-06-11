import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const versionFile = path.join(repoRoot, "app.version");

/**
 * Monotonic integer release version for web, Android, and iOS.
 * CI sets APP_VERSION; local builds read app.version (default 0).
 */
export function resolveAppVersion(env = process.env) {
  const fromEnv = env.APP_VERSION?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (fs.existsSync(versionFile)) {
    return fs.readFileSync(versionFile, "utf8").trim();
  }

  return "0";
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${resolveAppVersion()}\n`);
}
