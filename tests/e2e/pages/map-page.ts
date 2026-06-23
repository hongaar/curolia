import type { Page } from "@playwright/test";

import {
  clusterCamera,
  mapUrlWithCamera,
  mapUrlWithCameraAt,
  seed,
  targetPinCamera,
} from "../fixtures/seed.ts";

export class MapPage {
  constructor(private readonly page: Page) {}

  async gotoMap(pinSlug?: string): Promise<void> {
    await this.page.goto(mapUrlWithCamera(seed, pinSlug));
    await this.waitForMapReady();
  }

  async gotoTargetPinView(): Promise<void> {
    await this.page.goto(mapUrlWithCameraAt(seed, targetPinCamera()));
    await this.waitForMapReady();
  }

  async gotoClusterView(): Promise<void> {
    await this.page.goto(mapUrlWithCameraAt(seed, clusterCamera()));
    await this.waitForMapReady();
  }

  async waitForMapReady(): Promise<void> {
    await this.page
      .getByText("Loading", { exact: false })
      .waitFor({
        state: "detached",
        timeout: 60_000,
      })
      .catch(() => undefined);
    await this.page.locator("[data-curolia-pin-map]").waitFor({
      state: "visible",
      timeout: 60_000,
    });
    await this.waitForMapStable();
  }

  /** Wait for MapLibre idle + brief settle (E2E probe signal). */
  async waitForMapStable(): Promise<void> {
    await this.page
      .waitForFunction(() => (window.__curoliaMapIdle ?? 0) >= 1, {
        timeout: 60_000,
      })
      .catch(() => undefined);
    await this.page.waitForTimeout(400);
  }

  async resetPerfAfterSettle(perfReset: () => Promise<void>): Promise<void> {
    await this.waitForMapStable();
    await perfReset();
  }

  pinMarker(pinId: string) {
    return this.page.locator(`[data-pin-id="${pinId}"] button`);
  }

  async clickPinByTitle(title: string): Promise<void> {
    const marker = this.page.getByRole("button", { name: title });
    await marker.waitFor({ state: "visible", timeout: 15_000 });
    await marker.click();
  }

  async clickPin(pinId: string): Promise<void> {
    if (pinId === seed.targetPinId) {
      await this.gotoTargetPinView();
      await this.clickPinByTitle("E2E Target Pin");
      return;
    }
    if (pinId === seed.clusterPinId) {
      await this.clickClusterMarker();
      return;
    }
    const marker = this.pinMarker(pinId);
    await marker.waitFor({ state: "visible", timeout: 15_000 });
    await marker.click();
  }

  async clickClusterMarker(options?: { navigate?: boolean }): Promise<void> {
    if (options?.navigate !== false) {
      await this.gotoClusterView();
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const clusterBtn = this.page.getByRole("button", {
        name: /overlapping pins/i,
      });
      await clusterBtn.waitFor({ state: "visible", timeout: 10_000 });
      await clusterBtn.click();
      await this.page.waitForTimeout(800);

      const picker = this.page.getByRole("listbox").first();
      const closeButton = this.page.getByRole("button", {
        name: "Close pin details",
      });
      const bottomSheet = this.bottomSheet();
      if (
        (await picker.isVisible().catch(() => false)) ||
        (await closeButton.isVisible().catch(() => false)) ||
        (await bottomSheet.isVisible().catch(() => false))
      ) {
        return;
      }
    }

    throw new Error("Cluster click did not open pin UI after zoom attempts");
  }

  bottomSheet() {
    return this.page.locator('[data-slot="bottom-sheet"]');
  }

  async panMap(deltaX: number, deltaY: number, steps = 8): Promise<void> {
    const map = this.page.locator("[data-curolia-pin-map]");
    const box = await map.boundingBox();
    if (!box) throw new Error("Map container not found");
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + deltaX, startY + deltaY, { steps });
    await this.page.mouse.up();
    await this.page.waitForTimeout(400);
  }

  async zoomMap(deltaY: number): Promise<void> {
    const map = this.page.locator("[data-curolia-pin-map]");
    const box = await map.boundingBox();
    if (!box) throw new Error("Map container not found");
    await this.page.mouse.wheel(
      box.x + box.width / 2,
      box.y + box.height / 2,
      0,
      deltaY,
    );
    await this.page.waitForTimeout(400);
  }
}

export class SearchPanel {
  constructor(private readonly page: Page) {}

  private searchInput() {
    return this.page.getByRole("combobox", {
      name: "Search maps, pins, actions, and pages",
    });
  }

  async open(): Promise<void> {
    const input = this.searchInput();
    const viewport = this.page.viewportSize();
    const useKeyboard = viewport !== null && viewport.width >= 768;

    if (useKeyboard) {
      await this.page.keyboard.press(
        process.platform === "darwin" ? "Meta+k" : "Control+k",
      );
    } else {
      await input.click();
    }

    await input.waitFor({ state: "visible", timeout: 10_000 });
  }

  async searchAndPickPin(query: string): Promise<void> {
    const input = this.searchInput();
    await input.fill(query);
    await this.page.locator("#curolia-search-listbox").waitFor({
      state: "visible",
    });
    await this.page
      .locator('[id^="curolia-search-listbox-option-pin-"]')
      .first()
      .click();
  }
}
