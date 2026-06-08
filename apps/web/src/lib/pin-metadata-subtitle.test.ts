import {
  defaultPinMetadataShowSettings,
  pinMetadataSubtitleFromRows,
  type PinMetadataRow,
} from "@curolia/plugin-contract";
import { describe, expect, it } from "vitest";

const base = {
  map_id: "map",
  pin_id: "pin",
  source_plugin_id: "poi",
  created_at: "2026-01-01T00:00:00Z",
};

describe("pinMetadataSubtitleFromRows", () => {
  it("builds subtitle parts from pin metadata rows regardless of source", () => {
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
        source_plugin_id: "wikidata",
        field_key: "place_categories",
        value: { food: true, outdoor: false },
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    expect(
      pinMetadataSubtitleFromRows(rows, defaultPinMetadataShowSettings()),
    ).toEqual({
      parts: [
        { kind: "text", text: "Café" },
        { kind: "text", text: "Italian" },
        { kind: "wheelchair_friendly" },
      ],
    });
  });
});
