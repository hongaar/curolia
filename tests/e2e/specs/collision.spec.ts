import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

test.describe("collision", () => {
  test("cluster click opens pin UI", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    const map = new MapPage(page);
    await map.gotoClusterView();
    await map.resetPerfAfterSettle(perfReset);
    await map.clickClusterMarker({ navigate: false });

    await expect(
      page
        .locator(
          '[data-slot="bottom-sheet"], [role="listbox"][aria-label*="pins here"]',
        )
        .first(),
    ).toBeVisible({ timeout: 8_000 });

    const snapshot = await perfSnapshot();
    await finishFlow("collision", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });
});
