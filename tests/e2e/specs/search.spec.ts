import { authAvailable, authFile } from "../fixtures/auth.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage, SearchPanel } from "../pages/map-page.ts";

test.describe("search @smoke", () => {
  test.beforeEach(() => {
    if (!authAvailable()) test.skip();
  });
  test.use({ storageState: authFile });

  test("cmd+k pin search navigates to map with pin", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "toolbar search is hidden below 40rem viewport",
    );

    const map = new MapPage(page);
    const search = new SearchPanel(page);
    await map.gotoMap();
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await search.open();
    await search.searchAndPickPin("E2E Target");
    await expect(page).toHaveURL(/pin=/, { timeout: 15_000 });
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("search", {
      consoleErrors,
      snapshot,
      timings: { "search-pick": wallMs },
      recordFlowMetric,
    });
  });
});
