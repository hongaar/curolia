import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";

const MARKETING_ROUTES = [
  "/",
  "/privacy",
  "/terms",
  "/contact",
  "/open-source",
  "/plugins-overview",
  "/for/travel",
] as const;

test.describe("marketing hydration @smoke", () => {
  for (const route of MARKETING_ROUTES) {
    test(`hydrates ${route} without console errors`, async ({
      page,
      consoleErrors,
      perfSnapshot,
      recordFlowMetric,
    }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();

      const snapshot = await perfSnapshot();
      await finishFlow("map-load", {
        consoleErrors,
        snapshot,
        recordFlowMetric,
      });
    });
  }
});
