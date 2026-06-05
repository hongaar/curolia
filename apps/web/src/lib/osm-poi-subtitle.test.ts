import type { PinMetadataRow } from "@curolia/plugin-contract";
import { osmPoiSubtitleFromMetadata } from "@curolia/plugin-osm-poi";
import { describe, expect, it } from "vitest";

const base = {
  map_id: "map",
  pin_id: "pin",
  source_plugin_id: "osm-poi",
  created_at: "2026-01-01T00:00:00Z",
};

describe("osmPoiSubtitleFromMetadata", () => {
  it("builds rich subtitle parts from pin metadata rows", () => {
    const rows: PinMetadataRow[] = [
      {
        ...base,
        id: "1",
        field_key: "place_type",
        value: { label: "Café" },
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        ...base,
        id: "2",
        field_key: "wheelchair_access",
        value: { level: "yes" },
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        ...base,
        id: "3",
        field_key: "cuisine",
        value: { label: "Italian" },
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        ...base,
        id: "4",
        field_key: "place_categories",
        value: { food: true, outdoor: false },
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    expect(
      osmPoiSubtitleFromMetadata(rows, {
        food: true,
        accessibility: true,
        outdoor: true,
      }),
    ).toEqual({
      parts: [
        { kind: "text", text: "Café" },
        { kind: "wheelchair_friendly" },
        { kind: "text", text: "Italian" },
      ],
    });
  });
});
