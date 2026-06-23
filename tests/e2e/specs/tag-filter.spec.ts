import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

test.describe("tag filter", () => {
  test("tag filter control is reachable on map", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    const map = new MapPage(page);
    await map.gotoMap();
    await map.resetPerfAfterSettle(perfReset);

    const tagFilters = page.getByRole("button", { name: "Tag filters" });
    await tagFilters.click();
    await expect(page.getByRole("menu")).toBeVisible({ timeout: 8_000 });

    const snapshot = await perfSnapshot();
    await finishFlow("map-load", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });
});
