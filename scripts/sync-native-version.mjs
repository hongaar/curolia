import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveAppVersion } from "./resolve-app-version.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const version = resolveAppVersion();

const pbxprojPath = path.join(
  repoRoot,
  "apps/mobile/ios/App/App.xcodeproj/project.pbxproj",
);

let pbxproj = fs.readFileSync(pbxprojPath, "utf8");
pbxproj = pbxproj.replace(
  /MARKETING_VERSION = [^;]+;/g,
  `MARKETING_VERSION = ${version};`,
);
pbxproj = pbxproj.replace(
  /CURRENT_PROJECT_VERSION = [^;]+;/g,
  `CURRENT_PROJECT_VERSION = ${version};`,
);
fs.writeFileSync(pbxprojPath, pbxproj);

process.stdout.write(`Synced iOS native version to ${version}\n`);
