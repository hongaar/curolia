import { describe, expect, it } from "vitest";

import { mapStyleCacheKey } from "./map-style";
import {
  basemapFromMap,
  resolvePinMapBasemap,
} from "../hooks/use-quick-settings-basemap-draft";

const streetMap = {
  style: "street",
  style_hillshades: false,
  style_satellite_labels: false,
} as const;

const satelliteMap = {
  style: "satellite",
  style_hillshades: false,
  style_satellite_labels: true,
} as const;

describe("basemapFromMap", () => {
  it("normalizes saved map style fields", () => {
    expect(basemapFromMap(satelliteMap)).toEqual({
      preset: "satellite",
      options: { hillshades: false, satelliteLabels: true },
    });
  });
});

describe("resolvePinMapBasemap", () => {
  it("uses active map style when quick settings are closed", () => {
    expect(
      resolvePinMapBasemap({
        activeMap: satelliteMap,
        quickSettingsStyleActive: false,
        draft: {
          preset: "auto",
          options: { hillshades: false, satelliteLabels: false },
        },
      }),
    ).toEqual({
      preset: "satellite",
      options: { hillshades: false, satelliteLabels: true },
    });
  });

  it("uses draft when quick settings are open", () => {
    expect(
      resolvePinMapBasemap({
        activeMap: streetMap,
        quickSettingsStyleActive: true,
        draft: {
          preset: "auto",
          options: { hillshades: true, satelliteLabels: false },
        },
      }),
    ).toEqual({
      preset: "auto",
      options: { hillshades: true, satelliteLabels: false },
    });
  });
});

describe("mapStyleCacheKey", () => {
  it("distinguishes street and satellite presets", () => {
    expect(mapStyleCacheKey("street", "light")).toBe("street");
    expect(mapStyleCacheKey("satellite", "light")).toBe("satellite:plain");
    expect(
      mapStyleCacheKey("satellite", "light", {
        hillshades: false,
        satelliteLabels: true,
      }),
    ).toBe("satellite:labels");
  });
});
