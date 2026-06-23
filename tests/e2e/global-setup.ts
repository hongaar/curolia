import { chromium, type FullConfig } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { seed } from "./fixtures/seed.ts";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(e2eDir, "../..");
const authDir = path.join(e2eDir, ".auth");
const authFile = path.join(authDir, "user.json");
const authUnavailableFile = path.join(authDir, "unavailable");

async function globalSetup(config: FullConfig): Promise<void> {
  console.log("[e2e] Global setup: seeding database…");
  try {
    execSync("npm run db:seed:e2e -w @curolia/supabase", {
      cwd: repoRoot,
      stdio: "inherit",
      env: process.env,
    });
    console.log("[e2e] Global setup: seed complete");
  } catch (error) {
    console.warn("E2E seed failed — using committed seed.json fixture", error);
  }

  fs.mkdirSync(authDir, { recursive: true });
  fs.mkdirSync(path.join(e2eDir, ".metrics"), { recursive: true });
  fs.rmSync(authUnavailableFile, { force: true });

  const baseURL = config.projects[0]?.use?.baseURL ?? "http://127.0.0.1:5173";
  console.log(`[e2e] Global setup: signing in at ${baseURL}/login…`);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseURL}/login`);
    await page.locator("#email").fill(seed.userEmail);
    await page.locator("#password").fill(seed.userPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 30_000,
    });
    await context.storageState({ path: authFile });
    console.log("E2E auth storage state saved");
  } catch (error) {
    console.warn(
      "E2E auth setup failed — authenticated specs will be skipped",
      error,
    );
    fs.rmSync(authFile, { force: true });
    fs.writeFileSync(authUnavailableFile, new Date().toISOString());
  } finally {
    await browser.close();
  }
}

export default globalSetup;
