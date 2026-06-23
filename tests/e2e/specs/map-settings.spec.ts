import { authAvailable, authFile } from "../fixtures/auth.ts";
import { seed } from "../fixtures/seed.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

test.describe("map settings", () => {
  test.beforeEach(() => {
    if (!authAvailable()) test.skip();
  });
  test.use({ storageState: authFile });

  test("owner can open quick settings and change basemap", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop quick settings side panel",
    );

    const map = new MapPage(page);
    await page.goto(`/${seed.profileSlug}/${seed.mapSlug}/map`);
    await map.waitForMapReady();
    await map.resetPerfAfterSettle(perfReset);

    await page.getByRole("button", { name: "Map settings" }).click();
    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();

    await page.getByText("Minimal", { exact: true }).click();

    await page.getByRole("button", { name: "Close map settings" }).click();

    const snapshot = await perfSnapshot();
    await finishFlow("map-load", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });
});
