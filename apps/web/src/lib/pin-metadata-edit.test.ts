import {
  groupPinMetadataForDisplay,
  PIN_METADATA_MANUAL_SOURCE_ID,
  type PinMetadataRow,
} from "@curolia/plugin-contract";
import { describe, expect, it } from "vitest";
import {
  pinMetadataDraftFromValue,
  pinMetadataValueFromDraft,
} from "./pin-metadata-edit";

describe("pinMetadataValueFromDraft", () => {
  it("parses opening hours lines into OSM-style raw text", () => {
    expect(
      pinMetadataValueFromDraft("opening_hours", {
        primary: "Mo-Fr 09:00-17:00\n\nSa 10:00-14:00",
        secondary: "",
      }),
    ).toEqual({
      raw: "Mo-Fr 09:00-17:00; Sa 10:00-14:00",
      display: "Mo-Fr 09:00-17:00\nSa 10:00-14:00",
    });
  });

  it("normalizes website and phone", () => {
    expect(
      pinMetadataValueFromDraft("website", {
        primary: "example.com/menu",
        secondary: "",
      }),
    ).toEqual({ url: "https://example.com/menu" });
    expect(
      pinMetadataValueFromDraft("phone", {
        primary: "+31 (0)20 123 4567",
        secondary: "",
      }),
    ).toEqual({ tel: "+310201234567", display: "+31 (0)20 123 4567" });
  });

  it("rejects empty and invalid input", () => {
    expect(
      pinMetadataValueFromDraft("cuisine", { primary: "  ", secondary: "" }),
    ).toBeNull();
    expect(
      pinMetadataValueFromDraft("email", { primary: "nope", secondary: "" }),
    ).toBeNull();
  });

  it("round-trips dietary options", () => {
    const value = pinMetadataValueFromDraft("dietary_options", {
      primary: "Vegan, Gluten-free,",
      secondary: "",
    });
    expect(value).toEqual({ labels: ["Vegan", "Gluten-free"] });
    expect(pinMetadataDraftFromValue("dietary_options", value!)).toEqual({
      primary: "Vegan, Gluten-free",
      secondary: "",
    });
  });
});

describe("groupPinMetadataForDisplay", () => {
  it("prefers manual rows over newer plugin rows", () => {
    const base = {
      map_id: "m",
      pin_id: "p",
      field_key: "cuisine" as const,
      created_at: "2026-01-01T00:00:00Z",
    };
    const rows: PinMetadataRow[] = [
      {
        ...base,
        id: "1",
        source_plugin_id: PIN_METADATA_MANUAL_SOURCE_ID,
        value: { label: "Mine" },
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        ...base,
        id: "2",
        source_plugin_id: "poi",
        value: { label: "Plugin" },
        updated_at: "2026-02-01T00:00:00Z",
      },
    ];
    expect(groupPinMetadataForDisplay(rows)[0]).toMatchObject({
      value: { label: "Mine" },
      sourcePluginId: PIN_METADATA_MANUAL_SOURCE_ID,
    });
  });
});
