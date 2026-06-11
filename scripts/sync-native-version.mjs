import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveAppVersion } from "./resolve-app-version.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const version = resolveAppVersion();

/** Xcode build settings: quote non-numeric values (e.g. dev). */
function formatXcodeVersion(value) {
  return /^\d+(\.\d+)*$/.test(value) ? value : `"${value}"`;
}

const pbxprojPath = path.join(
  repoRoot,
  "apps/mobile/ios/App/App.xcodeproj/project.pbxproj",
);

let pbxproj = fs.readFileSync(pbxprojPath, "utf8");
pbxproj = pbxproj.replace(
  /MARKETING_VERSION = [^;]+;/g,
  `MARKETING_VERSION = ${formatXcodeVersion(version)};`,
);
pbxproj = pbxproj.replace(
  /CURRENT_PROJECT_VERSION = [^;]+;/g,
  `CURRENT_PROJECT_VERSION = ${formatXcodeVersion(version)};`,
);
fs.writeFileSync(pbxprojPath, pbxproj);

process.stdout.write(`Synced iOS native version to ${version}\n`);
