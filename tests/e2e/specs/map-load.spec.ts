import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

test.describe("map load @smoke", () => {
  test("public dense map loads without errors", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    await perfReset();
    const start = Date.now();
    const map = new MapPage(page);
    await map.gotoMap();
    const wallMs = Date.now() - start;

    await expect(page.locator("[data-curolia-pin-map]")).toBeVisible();
    await expect(page.locator(".maplibregl-canvas")).toBeVisible();

    const snapshot = await perfSnapshot();
    await finishFlow("map-load", {
      consoleErrors,
      snapshot,
      timings: { "map-load": wallMs },
      recordFlowMetric,
    });
  });
});
