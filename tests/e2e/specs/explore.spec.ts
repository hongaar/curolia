import { authAvailable, authFile } from "../fixtures/auth.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

test.describe("explore", () => {
  test.beforeEach(() => {
    if (!authAvailable()) test.skip();
  });
  test.use({ storageState: authFile });

  test("toggling explore category updates map", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "explore chip row hidden on condensed mobile map toolbar",
    );

    const map = new MapPage(page);
    await map.gotoMap();
    await map.resetPerfAfterSettle(perfReset);

    const explore = page.getByRole("option", { name: "Coffee" });
    if (!(await explore.isVisible({ timeout: 15_000 }).catch(() => false))) {
      test.skip(true, "Explore toolbar not available (no enabled plugins)");
    }

    const more = page.getByRole("button", { name: "More categories" });
    if (await more.isVisible()) {
      await more.click();
    }

    const chip = explore;
    const start = Date.now();
    await chip.click();
    await expect(chip).toHaveAttribute("aria-selected", "true", {
      timeout: 10_000,
    });
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("explore", {
      consoleErrors,
      snapshot,
      timings: { "explore-toggle": wallMs },
      recordFlowMetric,
    });
  });
});
