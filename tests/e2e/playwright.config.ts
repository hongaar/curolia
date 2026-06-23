import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(e2eDir, "../..");
const webDir = path.resolve(repoRoot, "apps/web");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      [
        `Missing required environment variable: ${name}`,
        "",
        "Run E2E via the workspace script (loads credentials from `supabase status`):",
        "  npm run e2e -w @curolia/e2e",
        "",
        "Prerequisites:",
        "  npm run db:start -w @curolia/supabase",
      ].join("\n"),
    );
  }
  return value;
}

const viteSupabaseUrl = requireEnv("VITE_SUPABASE_URL");
const viteSupabaseKey = requireEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["./reporters/metrics-reporter.ts"],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  globalSetup: "./global-setup.ts",
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    cwd: webDir,
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_E2E: "1",
      VITE_SUPABASE_URL: viteSupabaseUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: viteSupabaseKey,
    },
  },
});
