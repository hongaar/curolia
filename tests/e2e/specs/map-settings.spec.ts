import { createClient } from "@supabase/supabase-js";

import { authAvailable, authFile } from "../fixtures/auth.ts";
import { seed } from "../fixtures/seed.ts";
import { expect, test } from "../fixtures/test.ts";
import { finishFlow } from "../lib/finish-flow.ts";
import { MapPage } from "../pages/map-page.ts";

const STREET_STYLE_KEY = "street";
const SATELLITE_STYLE_KEY = "satellite:labels";
const PRIMARY_MAP_NAME = "E2E Dense Map";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing local Supabase credentials for map style reset");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resetSeededMapBasemaps(): Promise<void> {
  const admin = supabaseAdmin();
  const { error: primaryError } = await admin
    .from("maps")
    .update({ style: "street", style_satellite_labels: false })
    .eq("id", seed.mapId);
  if (primaryError) throw primaryError;
  const { error: secondaryError } = await admin
    .from("maps")
    .update({ style: "satellite", style_satellite_labels: true })
    .eq("id", seed.secondaryMapId);
  if (secondaryError) throw secondaryError;
}

test.describe("map settings", () => {
  test.beforeEach(async () => {
    if (!authAvailable()) test.skip();
    await resetSeededMapBasemaps();
  });
  test.use({ storageState: authFile });

  test("owner can open quick settings and change basemap", async ({
    page,
    consoleErrors,
    perfReset,
    perfSnapshot,
    recordFlowMetric,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop quick settings side panel",
    );

    const map = new MapPage(page);
    await page.goto(`/${seed.profileSlug}/${seed.mapSlug}/map`);
    await map.waitForMapReady();
    await map.resetPerfAfterSettle(perfReset);

    await page.getByRole("button", { name: "Map settings" }).click();
    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();

    await page.getByText("Minimal", { exact: true }).click();

    await page.getByRole("button", { name: "Close map settings" }).click();

    const snapshot = await perfSnapshot();
    await finishFlow("map-settings", {
      consoleErrors,
      snapshot,
      recordFlowMetric,
    });
  });

  test("switching maps with quick settings open does not copy settings", async ({
    page,
    consoleErrors,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop quick settings side panel",
    );
    test.setTimeout(90_000);

    const map = new MapPage(page);
    await page.goto(`/${seed.profileSlug}/${seed.mapSlug}/map`);
    await map.waitForMapReady();

    await page.getByRole("button", { name: "Map settings" }).click();
    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /Street/i })).toBeChecked();

    await page.getByText("Minimal", { exact: true }).click();
    await expect(page.getByRole("radio", { name: /Minimal/i })).toBeChecked();
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Saved")).toBeHidden({ timeout: 15_000 });

    await map.switchToMap(seed.secondaryMapName, seed.secondaryMapSlug);
    await expect(
      page.getByRole("button", { name: "Select map" }),
    ).toContainText(seed.secondaryMapName);

    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /Satellite/i })).toBeChecked();
    await expect(
      page.getByRole("radio", { name: /Minimal/i }),
    ).not.toBeChecked();

    const { data: primary, error: primaryError } = await supabaseAdmin()
      .from("maps")
      .select("style")
      .eq("id", seed.mapId)
      .single();
    if (primaryError) throw primaryError;
    expect(primary?.style).toBe("auto");

    expect(consoleErrors).toEqual([]);
  });

  test("switching maps updates basemap tiles with settings closed", async ({
    page,
    consoleErrors,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop map switcher",
    );
    test.setTimeout(90_000);

    const map = new MapPage(page);
    await page.goto(`/${seed.profileSlug}/${seed.mapSlug}/map`);
    await map.waitForMapReady();
    await map.waitForMapStyleKey(STREET_STYLE_KEY);

    await map.switchToMap(seed.secondaryMapName, seed.secondaryMapSlug);
    await expect(
      page.getByRole("button", { name: "Select map" }),
    ).toContainText(seed.secondaryMapName);
    await map.waitForMapStyleKey(SATELLITE_STYLE_KEY);

    await map.switchToMap(PRIMARY_MAP_NAME, seed.mapSlug);
    await expect(
      page.getByRole("button", { name: "Select map" }),
    ).toContainText(PRIMARY_MAP_NAME);
    await map.waitForMapStyleKey(STREET_STYLE_KEY);

    expect(consoleErrors).toEqual([]);
  });

  test("switching maps updates basemap tiles with settings open", async ({
    page,
    consoleErrors,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop quick settings side panel",
    );
    test.setTimeout(90_000);

    const map = new MapPage(page);
    await page.goto(`/${seed.profileSlug}/${seed.mapSlug}/map`);
    await map.waitForMapReady();
    await map.waitForMapStyleKey(STREET_STYLE_KEY);

    await page.getByRole("button", { name: "Map settings" }).click();
    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /Street/i })).toBeChecked();

    await map.switchToMap(seed.secondaryMapName, seed.secondaryMapSlug);
    await expect(
      page.getByRole("button", { name: "Select map" }),
    ).toContainText(seed.secondaryMapName);
    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /Satellite/i })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Labels" })).toBeChecked();
    await map.waitForMapStyleKey(SATELLITE_STYLE_KEY);

    await map.switchToMap(PRIMARY_MAP_NAME, seed.mapSlug);
    await expect(
      page.getByRole("button", { name: "Select map" }),
    ).toContainText(PRIMARY_MAP_NAME);
    await expect(
      page.getByRole("button", { name: "Close map settings" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: /Street/i })).toBeChecked();
    await map.waitForMapStyleKey(STREET_STYLE_KEY);

    expect(consoleErrors).toEqual([]);
  });
});
