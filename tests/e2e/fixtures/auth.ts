import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { test as base } from "@playwright/test";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
export const authFile = path.join(e2eDir, "../.auth/user.json");
const authUnavailableFile = path.join(e2eDir, "../.auth/unavailable");

export function authAvailable(): boolean {
  return fs.existsSync(authFile) && !fs.existsSync(authUnavailableFile);
}

export const test = base.extend({
  authenticated: async ({}, use) => {
    if (!authAvailable()) {
      base.skip(true, "E2E auth storage state unavailable");
    }
    await use(true);
  },
});

export { expect } from "@playwright/test";
