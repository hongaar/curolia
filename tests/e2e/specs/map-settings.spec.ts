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
    await finishFlow("map-settings", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });

  test("switching maps with quick settings open does not copy settings", async ({
    page,
    consoleErrors,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop quick settings side panel",
    );
    test.setTimeout(90_000);

    await page.goto(`/${seed.profileSlug}/${seed.mapSlug}/map`);
    await page.locator("[data-curolia-pin-map]").waitFor({
      state: "visible",
      timeout: 60_000,
    });

    await page.getByRole("button", { name: "Map settings" }).click();
    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /Street/i })).toBeChecked();

    await page.getByText("Minimal", { exact: true }).click();
    await expect(page.getByRole("radio", { name: /Minimal/i })).toBeChecked();
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Select map" }).click();
    await page.getByRole("menuitem", { name: seed.secondaryMapName }).click();
    await page.waitForURL(`**/${seed.secondaryMapSlug}/map`);
    await expect(
      page.getByRole("button", { name: "Select map" }),
    ).toContainText(seed.secondaryMapName);
    await page.locator("[data-curolia-pin-map]").waitFor({
      state: "visible",
      timeout: 60_000,
    });

    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /Satellite/i })).toBeChecked();
    await expect(
      page.getByRole("radio", { name: /Minimal/i }),
    ).not.toBeChecked();

    await page.getByRole("button", { name: "Select map" }).click();
    await page.getByRole("menuitem", { name: "E2E Dense Map" }).click();
    await page.waitForURL(`**/${seed.mapSlug}/map`);
    await expect(
      page.getByRole("button", { name: "Select map" }),
    ).toContainText("E2E Dense Map");

    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /Minimal/i })).toBeChecked();

    expect(consoleErrors).toEqual([]);
  });
});
