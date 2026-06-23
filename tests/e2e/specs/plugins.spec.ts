import { authAvailable, authFile } from "../fixtures/auth.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

test.describe("plugin surfaces", () => {
  test.beforeEach(() => {
    if (!authAvailable()) test.skip();
  });
  test.use({ storageState: authFile });

  test("pin detail renders without plugin errors", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    const map = new MapPage(page);
    await map.gotoTargetPinView();
    await map.resetPerfAfterSettle(perfReset);
    await map.clickPinByTitle("E2E Target Pin");

    await expect(
      page.getByRole("button", { name: "Close pin details" }),
    ).toBeVisible({ timeout: 12_000 });

    const snapshot = await perfSnapshot();
    await finishFlow("pin-detail", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });
});
