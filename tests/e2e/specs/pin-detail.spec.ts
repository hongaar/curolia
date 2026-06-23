import { authAvailable, authFile } from "../fixtures/auth.ts";
import { seed } from "../fixtures/seed.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

test.describe("pin detail @smoke", () => {
  test("desktop opens side panel and sets pin URL", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop layout only",
    );

    const map = new MapPage(page);
    await map.gotoTargetPinView();
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await map.clickPinByTitle("E2E Target Pin");
    await expect(page).toHaveURL(new RegExp(`pin=${seed.targetPinSlug}`));
    await expect(
      page.getByRole("button", { name: "Close pin details" }),
    ).toBeVisible({ timeout: 10_000 });
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("pin-detail", {
      consoleErrors,
      snapshot,
      timings: { "pin-open": wallMs },
      recordFlowMetric,
    });
  });

  test("mobile opens bottom sheet", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chromium",
      "mobile layout only",
    );

    const map = new MapPage(page);
    await map.gotoTargetPinView();
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await map.clickPinByTitle("E2E Target Pin");
    await expect(map.bottomSheet()).toBeVisible({ timeout: 10_000 });
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("pin-detail", {
      consoleErrors,
      snapshot,
      timings: { "pin-open": wallMs },
      recordFlowMetric,
    });
  });
});

test.describe("pin detail authenticated", () => {
  test.beforeEach(() => {
    if (!authAvailable()) test.skip();
  });
  test.use({ storageState: authFile });

  test("owner can open target pin from map", async ({
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
    ).toBeVisible({ timeout: 10_000 });

    const snapshot = await perfSnapshot();
    await finishFlow("pin-detail", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });
});
