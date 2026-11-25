import type { Page } from "@playwright/test";

import { seed } from "../fixtures/seed.ts";
import { expect, test } from "../fixtures/test.ts";
import { MapPage } from "../pages/map-page.ts";

/** Must match `PANEL_LINE_CONTENT_GAP_PX` in `map-panel-pin-connector.tsx`. */
const PANEL_LINE_CONTENT_GAP_PX = 12;

const activeCard = `[data-gallery-pin-id="${seed.targetPinId}"]`;

/**
 * Distance (px) between the drawn panel line start and where it should be:
 * left of the card's line anchor, vertically within the card.
 */
async function connectorDrift(page: Page): Promise<number> {
  return page.evaluate(
    ({ selector, gap }) => {
      const line = document.querySelector('[data-pin-connector="panel"] line');
      const entry = document.querySelector(selector);
      const anchor = entry?.querySelector("[data-pin-line-anchor]");
      if (!(line instanceof SVGLineElement) || !entry || !anchor) {
        return Number.POSITIVE_INFINITY;
      }
      const svgRect = line.ownerSVGElement!.getBoundingClientRect();
      const x = svgRect.left + line.x1.baseVal.value;
      const y = svgRect.top + line.y1.baseVal.value;
      const anchorRect = anchor.getBoundingClientRect();
      const entryRect = entry.getBoundingClientRect();
      const dx = Math.abs(x - (anchorRect.left - gap));
      const dy = Math.max(0, entryRect.top - y, y - entryRect.bottom);
      return Math.max(dx, dy);
    },
    { selector: activeCard, gap: PANEL_LINE_CONTENT_GAP_PX },
  );
}

test.describe("map panel pin connector", () => {
  test("gallery reload with pin hash keeps the line on the card through reflows", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop gallery side panel only",
    );

    const map = new MapPage(page);
    await map.gotoViewTargetPinView("gallery");
    await map.clickMapPinMarker(seed.targetPinId, { force: true });
    await expect(page).toHaveURL(/#e2e-target-pin/);

    await page.reload();
    await map.waitForMapReady();
    await expect(page.locator(`${activeCard}[data-active="true"]`)).toBeVisible(
      { timeout: 15_000 },
    );
    await expect
      .poll(() => connectorDrift(page), { timeout: 8_000 })
      .toBeLessThan(2);

    // Real galleries reflow as photos load (masonry columns rebalance), which
    // moves the card without any scroll, resize or camera event. Simulate that
    // with a spacer above the card; the line must follow.
    await page.locator(activeCard).evaluate((card) => {
      const spacer = document.createElement("div");
      spacer.style.height = "120px";
      spacer.style.overflowAnchor = "none";
      card.parentElement!.style.overflowAnchor = "none";
      card.before(spacer);
    });
    await expect
      .poll(() => connectorDrift(page), { timeout: 1_000 })
      .toBeLessThan(2);
  });
});
