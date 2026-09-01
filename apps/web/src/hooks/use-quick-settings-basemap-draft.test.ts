import { describe, expect, it } from "vitest";

import { basemapFromMap } from "./use-quick-settings-basemap-draft";

describe("useQuickSettingsBasemapDraft reset", () => {
  it("basemapFromMap reflects satellite labels from the active map", () => {
    expect(
      basemapFromMap({
        style: "satellite",
        style_hillshades: false,
        style_satellite_labels: true,
      }),
    ).toEqual({
      preset: "satellite",
      options: { hillshades: false, satelliteLabels: true },
    });
  });
});
