import { authAvailable } from "../fixtures/auth.ts";
import { seed } from "../fixtures/seed.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";

test.describe("auth @smoke", () => {
  test("existing user can sign in", async ({
    page,
    consoleErrors,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    test.skip(!authAvailable(), "E2E user not seeded");
    await page.goto("/login");
    await page.locator("#email").fill(seed.userEmail);
    await page.locator("#password").fill(seed.userPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 30_000,
    });
    await page.locator("[data-curolia-pin-map]").waitFor({
      state: "visible",
      timeout: 30_000,
    });

    const snapshot = await perfSnapshot();
    await finishFlow("map-load", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });

  test("signup tab renders", async ({
    page,
    consoleErrors,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    await page.goto("/login?tab=signup");
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();

    const snapshot = await perfSnapshot();
    await finishFlow("map-load", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });
});
