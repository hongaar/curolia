import {
  isPinMetadataFieldShown,
  type PinMetadataShowSettings,
} from "./map-pin-metadata-display";
import { pinMetadataRowByField, type PinMetadataRow } from "./pin-metadata";

export type PinMetadataSubtitlePart =
  | { kind: "text"; text: string }
  | { kind: "wheelchair_friendly" }
  | { kind: "wheelchair_limited" }
  | { kind: "wheelchair_no" }
  | { kind: "dogs_welcome" }
  | { kind: "no_dogs" };

export type PinMetadataSubtitle = {
  parts: PinMetadataSubtitlePart[];
};

/** Build compact pin subtitle parts from provider-agnostic `pin_metadata` rows. */
export function pinMetadataSubtitleFromRows(
  rows: PinMetadataRow[],
  showSettings: PinMetadataShowSettings,
): PinMetadataSubtitle | null {
  const parts: PinMetadataSubtitlePart[] = [];

  const placeTypeRow = pinMetadataRowByField(rows, "place_type");
  if (
    placeTypeRow?.field_key === "place_type" &&
    isPinMetadataFieldShown("place_type", showSettings)
  ) {
    parts.push({ kind: "text", text: placeTypeRow.value.label });
  }

  if (isPinMetadataFieldShown("cuisine", showSettings)) {
    const cuisine = pinMetadataRowByField(rows, "cuisine");
    if (cuisine?.field_key === "cuisine") {
      const label = cuisine.value.label;
      if (!parts.some((part) => part.kind === "text" && part.text === label)) {
        parts.push({ kind: "text", text: label });
      }
    }
  }

  if (isPinMetadataFieldShown("wheelchair_access", showSettings)) {
    const wheelchair = pinMetadataRowByField(rows, "wheelchair_access");
    if (wheelchair?.value && "level" in wheelchair.value) {
      switch (wheelchair.value.level) {
        case "yes":
        case "designated":
          parts.push({ kind: "wheelchair_friendly" });
          break;
        case "limited":
          parts.push({ kind: "wheelchair_limited" });
          break;
        case "no":
          parts.push({ kind: "wheelchair_no" });
          break;
      }
    }
  }

  if (isPinMetadataFieldShown("dog_policy", showSettings)) {
    const dog = pinMetadataRowByField(rows, "dog_policy");
    if (dog?.value && "level" in dog.value) {
      switch (dog.value.level) {
        case "yes":
        case "leashed":
          parts.push({ kind: "dogs_welcome" });
          break;
        case "no":
          parts.push({ kind: "no_dogs" });
          break;
      }
    }
  }

  if (parts.length === 0) return null;
  return { parts };
}
