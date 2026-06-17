import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAP_VIEW_SETTINGS,
  normalizeMapViewSettings,
  resolveAccessibleMapView,
  setDefaultMapView,
  toggleMapViewEnabled,
} from "./map-view-settings";

describe("normalizeMapViewSettings", () => {
  it("defaults all views on for legacy rows", () => {
    expect(normalizeMapViewSettings(null)).toEqual(DEFAULT_MAP_VIEW_SETTINGS);
  });

  it("falls back when default view is disabled", () => {
    expect(
      normalizeMapViewSettings({
        default_map_view: "blog",
        enabled_map_views: { map: true, blog: false, gallery: true },
      }),
    ).toEqual({
      defaultView: "map",
      enabled: { map: true, blog: false, gallery: true },
    });
  });
});

describe("toggleMapViewEnabled", () => {
  it("moves default when disabling the current default", () => {
    const next = toggleMapViewEnabled(
      {
        defaultView: "blog",
        enabled: { map: true, blog: true, gallery: true },
      },
      "blog",
      false,
    );
    expect(next).toEqual({
      defaultView: "map",
      enabled: { map: true, blog: false, gallery: true },
    });
  });

  it("does not disable the last remaining view", () => {
    const settings = {
      defaultView: "map" as const,
      enabled: { map: true, blog: false, gallery: false },
    };
    expect(toggleMapViewEnabled(settings, "map", false)).toEqual(settings);
  });
});

describe("setDefaultMapView", () => {
  it("enables the chosen default view", () => {
    expect(
      setDefaultMapView(
        {
          defaultView: "map",
          enabled: { map: true, blog: false, gallery: true },
        },
        "blog",
      ),
    ).toEqual({
      defaultView: "blog",
      enabled: { map: true, blog: true, gallery: true },
    });
  });
});

describe("resolveAccessibleMapView", () => {
  it("redirects disabled views to default", () => {
    const settings = normalizeMapViewSettings({
      default_map_view: "map",
      enabled_map_views: { map: true, blog: false, gallery: true },
    });
    expect(resolveAccessibleMapView(settings, "blog")).toBe("map");
    expect(resolveAccessibleMapView(settings, "gallery")).toBe("gallery");
  });
});
