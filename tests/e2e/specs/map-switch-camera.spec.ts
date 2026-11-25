import type { Page } from "@playwright/test";

import { authAvailable, authFile } from "../fixtures/auth.ts";
import { seed } from "../fixtures/seed.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

const PRIMARY_MAP_NAME = "E2E Dense Map";
/** Max horizontal/vertical distance (px) between pin and visible-map centre. */
const CENTER_TOLERANCE_PX = 48;

type PinPlacement = {
  /** Pin centre minus the centre of the map area not covered by the panel. */
  dx: number;
  dy: number;
  /** Pin lies left of the content panel's edge (not hidden under it). */
  leftOfPanel: boolean;
};

/**
 * Where the blog pin sits relative to the part of the map left uncovered by
 * the blog/gallery side panel.
 */
async function blogPinPlacement(page: Page): Promise<PinPlacement | null> {
  return page.evaluate((pinId) => {
    const marker = document.querySelector(`[data-pin-id="${pinId}"]`);
    const mapEl = document.querySelector("[data-curolia-pin-map]");
    const panelItem = document.querySelector("[data-blog-pin-id]");
    if (!marker || !mapEl || !panelItem) return null;

    let panel: HTMLElement | null = panelItem.parentElement;
    while (panel) {
      const { overflowY } = getComputedStyle(panel);
      if (overflowY === "auto" || overflowY === "scroll") break;
      panel = panel.parentElement;
    }
    if (!panel) return null;

    const pin = marker.getBoundingClientRect();
    const map = mapEl.getBoundingClientRect();
    const panelLeft = panel.getBoundingClientRect().left;
    const visibleRight = Math.min(map.right, panelLeft);
    const pinX = pin.left + pin.width / 2;
    const pinY = pin.top + pin.height / 2;
    return {
      dx: pinX - (map.left + visibleRight) / 2,
      dy: pinY - (map.top + map.bottom) / 2,
      leftOfPanel: pinX < panelLeft,
    };
  }, seed.blogPinId);
}

async function expectBlogPinCentered(page: Page): Promise<void> {
  await expect
    .poll(() => blogPinPlacement(page), { timeout: 15_000 })
    .toMatchObject({ leftOfPanel: true });
  const placement = await blogPinPlacement(page);
  expect(Math.abs(placement!.dx)).toBeLessThan(CENTER_TOLERANCE_PX);
  expect(Math.abs(placement!.dy)).toBeLessThan(CENTER_TOLERANCE_PX);
}

function urlCamera(page: Page): { lat: number; lng: number } | null {
  const params = new URL(page.url()).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!params.has("lat") || !params.has("lng")) return null;
  return { lat, lng };
}

async function expectUrlCameraNear(
  page: Page,
  target: { lat: number; lng: number },
): Promise<void> {
  await expect
    .poll(
      () => {
        const cam = urlCamera(page);
        if (!cam) return Number.POSITIVE_INFINITY;
        return Math.max(
          Math.abs(cam.lat - target.lat),
          Math.abs(cam.lng - target.lng),
        );
      },
      { timeout: 15_000 },
    )
    .toBeLessThan(1);
}

test.describe("map switch camera @smoke", () => {
  // The map switcher lists the signed-in user's maps.
  test.use({ storageState: authFile });

  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(!authAvailable(), "E2E auth storage state unavailable");
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop blog side panel only",
    );
  });

  test("switching to a blog-default map centres its pins beside the panel", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    const map = new MapPage(page);
    await map.gotoMap();
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await map.switchToMap(seed.blogMapName, seed.blogMapSlug, "blog");
    await page.locator("[data-blog-pin-id]").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });
    // Regression: the panel-open resize wrote the previous map's camera into
    // the URL, which skipped the fit and left the camera on Amsterdam.
    await expectUrlCameraNear(page, seed.blogPinCenter);
    await map.waitForMapStable();
    // Regression: the fit ignored the panel inset and centred under the panel.
    await expectBlogPinCentered(page);
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("map-switch-camera", {
      consoleErrors,
      snapshot,
      timings: { "switch-to-blog-map": wallMs },
      recordFlowMetric,
    });
  });

  test("switching from a blog-default map fits the next map's pins", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    const map = new MapPage(page);
    await page.goto(`/${seed.profileSlug}/${seed.blogMapSlug}/blog`);
    await map.waitForMapReady();
    await expectUrlCameraNear(page, seed.blogPinCenter);
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    await map.switchToMap(PRIMARY_MAP_NAME, seed.mapSlug, "blog");
    await expectUrlCameraNear(page, seed.mapCenter);
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("map-switch-camera", {
      consoleErrors,
      snapshot,
      timings: { "switch-from-blog-map": wallMs },
      recordFlowMetric,
    });
  });

  test("blog view keeps its pin centred beside the panel on reload", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }) => {
    const map = new MapPage(page);
    await page.goto(`/${seed.profileSlug}/${seed.blogMapSlug}/blog`);
    await map.waitForMapReady();
    await page.locator("[data-blog-pin-id]").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await expectBlogPinCentered(page);
    await expect(page).toHaveURL(/[?&]lat=/, { timeout: 15_000 });
    await map.resetPerfAfterSettle(perfReset);

    const start = Date.now();
    // Regression: on reload the panel inset ran before MapLibre existed and
    // the pin ended up centred under the blog panel.
    await page.reload();
    await map.waitForMapReady();
    await page.locator("[data-blog-pin-id]").first().waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await expectBlogPinCentered(page);
    const wallMs = Date.now() - start;

    const snapshot = await perfSnapshot();
    await finishFlow("map-switch-camera", {
      consoleErrors,
      snapshot,
      timings: { "blog-reload": wallMs },
      recordFlowMetric,
    });
  });
});
