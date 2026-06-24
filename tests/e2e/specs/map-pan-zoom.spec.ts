import { test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

test.describe("map pan zoom", () => {
  test.setTimeout(120_000);

  test("dense map pan and zoom stay within perf budgets", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    const map = new MapPage(page);
    await map.gotoMap();
    await map.resetPerfAfterSettle(perfReset);

    for (let i = 0; i < 4; i += 1) {
      await map.panMap(120 * (i % 2 === 0 ? 1 : -1), 80);
    }
    for (let i = 0; i < 3; i += 1) {
      await map.zoomMap(-200);
      await map.zoomMap(200);
    }
    await map.waitForMapStable();

    const snapshot = await perfSnapshot();
    await finishFlow("map-pan-zoom", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });
});
