import type { Page } from "@playwright/test";

import { seed } from "../fixtures/seed.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

async function pinOffsetFromPanelTop(
  page: Page,
  selector: string,
): Promise<number> {
  return page.locator(selector).evaluate((el) => {
    let root: HTMLElement | null = el.parentElement;
    while (root) {
      const { overflowY } = getComputedStyle(root);
      if (overflowY === "auto" || overflowY === "scroll") break;
      root = root.parentElement;
    }
    if (!root) {
      throw new Error("no panel scroll root");
    }
    return el.getBoundingClientRect().top - root.getBoundingClientRect().top;
  });
}

async function expectPinNearPanelTop(
  page: Page,
  selector: string,
): Promise<void> {
  await expect
    .poll(() => pinOffsetFromPanelTop(page, selector), { timeout: 8_000 })
    .toBeGreaterThanOrEqual(8);
  await expect
    .poll(() => pinOffsetFromPanelTop(page, selector), { timeout: 8_000 })
    .toBeLessThan(80);
}

test.describe("map panel pin focus @smoke", () => {
  test("blog map pin click scrolls the panel instead of opening details", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop blog side panel only",
    );

    const map = new MapPage(page);
    await map.gotoViewTargetPinView("blog");
    await page.locator("[data-blog-pin-id]").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await map.clickMapPinMarker(seed.targetPinId, { force: true });
    await expect(
      page.locator(
        `[data-blog-pin-id="${seed.targetPinId}"] [data-active="true"]`,
      ),
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator(`[data-blog-pin-id="${seed.targetPinId}"]`),
    ).toBeInViewport();
    await expectPinNearPanelTop(
      page,
      `[data-blog-pin-id="${seed.targetPinId}"]`,
    );
    await expect(page).toHaveURL(/#e2e-target-pin/);
    await expect(
      page.getByRole("button", { name: "Close pin details" }),
    ).toHaveCount(0);
    await expect(page).not.toHaveURL(/[?&]pin=/);
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("map-panel-pin-focus", {
      consoleErrors,
      snapshot,
      timings: { "panel-pin-focus": wallMs },
      recordFlowMetric,
    });
  });

  test("gallery map pin click scrolls the panel instead of opening details", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop gallery side panel only",
    );

    const map = new MapPage(page);
    await map.gotoViewTargetPinView("gallery");
    await page.locator("[data-gallery-pin-id]").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await map.clickMapPinMarker(seed.targetPinId, { force: true });
    await expect(
      page.locator(
        `[data-gallery-pin-id="${seed.targetPinId}"][data-active="true"]`,
      ),
    ).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator(`[data-gallery-pin-id="${seed.targetPinId}"]`),
    ).toBeInViewport();
    await expectPinNearPanelTop(
      page,
      `[data-gallery-pin-id="${seed.targetPinId}"]`,
    );
    await expect(page).toHaveURL(/#e2e-target-pin/);
    await expect(
      page.getByRole("button", { name: "Close pin details" }),
    ).toHaveCount(0);
    await expect(page).not.toHaveURL(/[?&]pin=/);
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("map-panel-pin-focus", {
      consoleErrors,
      snapshot,
      timings: { "panel-pin-focus": wallMs },
      recordFlowMetric,
    });
  });

  test("blog to gallery drops the pin hash and does not keep focus", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop side panels only",
    );

    const map = new MapPage(page);
    await map.gotoViewTargetPinView("blog");
    await page.locator("[data-blog-pin-id]").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await map.clickMapPinMarker(seed.targetPinId, { force: true });
    await expect(page).toHaveURL(/\/blog.*#e2e-target-pin/);
    await page.getByRole("link", { name: "Gallery" }).click();
    await expect(page).toHaveURL(/\/gallery/);
    await expect(page).not.toHaveURL(/#e2e-target-pin/);
    await page.locator("[data-gallery-pin-id]").first().waitFor({
      state: "visible",
      timeout: 10_000,
    });
    await expect(
      page.locator(
        `[data-blog-pin-id] [data-active="true"], [data-gallery-pin-id][data-active="true"]`,
      ),
    ).toHaveCount(0);
    await expect
      .poll(
        () =>
          pinOffsetFromPanelTop(
            page,
            `[data-gallery-pin-id="${seed.targetPinId}"]`,
          ),
        { timeout: 8_000 },
      )
      .toBeGreaterThan(200);
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("map-panel-pin-focus", {
      consoleErrors,
      snapshot,
      timings: { "panel-pin-focus": wallMs },
      recordFlowMetric,
    });
  });

  test("refresh keeps the pin hash and scrolls near the panel top", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop blog side panel only",
    );

    const map = new MapPage(page);
    await map.gotoViewTargetPinView("blog");
    await page.locator("[data-blog-pin-id]").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await map.clickMapPinMarker(seed.targetPinId, { force: true });
    await expect(page).toHaveURL(/#e2e-target-pin/);
    await page.reload();
    await map.waitForMapReady();
    await page.locator(`[data-blog-pin-id="${seed.targetPinId}"]`).waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/[?&]lat=/, { timeout: 15_000 });
    await expect(page).toHaveURL(/#e2e-target-pin/);
    await expectPinNearPanelTop(
      page,
      `[data-blog-pin-id="${seed.targetPinId}"]`,
    );
    await expect(
      page.locator(
        `[data-blog-pin-id="${seed.targetPinId}"] [data-active="true"]`,
      ),
    ).toBeVisible({
      timeout: 10_000,
    });
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("map-panel-pin-focus", {
      consoleErrors,
      snapshot,
      timings: { "panel-pin-focus": wallMs },
      recordFlowMetric,
    });
  });

  test("pin detail permalink does not keep the panel pin active", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop blog side panel only",
    );

    const map = new MapPage(page);
    await map.gotoViewTargetPinView("blog");
    await page.locator("[data-blog-pin-id]").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await map.clickMapPinMarker(seed.targetPinId, { force: true });
    await expect(
      page.locator(
        `[data-blog-pin-id="${seed.targetPinId}"] [data-active="true"]`,
      ),
    ).toBeVisible({
      timeout: 10_000,
    });
    // Budget covers the panel focus only, not the detail navigation below.
    const wallMs = Date.now() - start;
    await page
      .locator(`[data-blog-pin-id="${seed.targetPinId}"]`)
      .getByRole("button", { name: "Pin details" })
      .click();
    // The side sheet renders only after its own pin query resolves, which can
    // take well over 10s on a loaded CI runner.
    await expect(page.getByLabel("Open full pin detail page")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel("Open full pin detail page").click();
    await expect(page).toHaveURL(/\/pin\//);
    await expect(
      page.locator(
        `[data-blog-pin-id] [data-active="true"], [data-gallery-pin-id][data-active="true"]`,
      ),
    ).toHaveCount(0);

    const snapshot = await perfSnapshot();
    await finishFlow("map-panel-pin-focus", {
      consoleErrors,
      snapshot,
      timings: { "panel-pin-focus": wallMs },
      recordFlowMetric,
    });
  });
});
