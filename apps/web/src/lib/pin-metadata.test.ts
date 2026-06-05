import {
  formatPinMetadataWebsiteLabel,
  groupPinMetadataForDisplay,
  parsePinMetadataRow,
  pinMetadataWebsiteDisplayLabel,
  type PinMetadataRow,
} from "@curolia/plugin-contract";
import { describe, expect, it } from "vitest";

describe("formatPinMetadataWebsiteLabel", () => {
  it("strips protocol, www, and trailing slashes", () => {
    expect(
      formatPinMetadataWebsiteLabel("https://www.brouwerijbrasser.nl/"),
    ).toBe("brouwerijbrasser.nl");
  });

  it("keeps short paths intact", () => {
    expect(
      formatPinMetadataWebsiteLabel("https://example.com/menu/dinner"),
    ).toBe("example.com/menu/dinner");
  });

  it("truncates long paths after two segments", () => {
    expect(formatPinMetadataWebsiteLabel("https://example.com/a/b/c/d/e")).toBe(
      "example.com/a/b/…",
    );
  });
});

describe("pinMetadataWebsiteDisplayLabel", () => {
  it("prefers an explicit label when provided", () => {
    expect(
      pinMetadataWebsiteDisplayLabel({
        url: "https://example.com/",
        label: "Example Brewery",
      }),
    ).toBe("Example Brewery");
  });
});

describe("parsePinMetadataRow", () => {
  it("parses typed metadata rows", () => {
    const row = parsePinMetadataRow({
      id: "1",
      map_id: "map",
      pin_id: "pin",
      field_key: "website",
      source_plugin_id: "osm-poi",
      value: { url: "https://example.com" },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    });
    expect(row?.value).toEqual({ url: "https://example.com" });
  });
});

describe("groupPinMetadataForDisplay", () => {
  const base = {
    map_id: "map",
    pin_id: "pin",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("picks the newest row per field and orders for display", () => {
    const rows: PinMetadataRow[] = [
      {
        ...base,
        id: "1",
        field_key: "phone",
        source_plugin_id: "osm-poi",
        value: { tel: "+31111" },
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        ...base,
        id: "2",
        field_key: "phone",
        source_plugin_id: "other",
        value: { tel: "+31222" },
        updated_at: "2026-01-03T00:00:00Z",
      },
      {
        ...base,
        id: "3",
        field_key: "website",
        source_plugin_id: "osm-poi",
        value: { url: "https://example.com" },
        updated_at: "2026-01-02T00:00:00Z",
      },
    ];

    const grouped = groupPinMetadataForDisplay(rows);
    expect(grouped.map((item) => item.fieldKey)).toEqual(["phone", "website"]);
    expect(grouped[0]?.value).toEqual({ tel: "+31222" });
    expect(grouped[0]?.sourcePluginId).toBe("other");
  });
});
