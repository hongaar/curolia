import type { PinMetadataRow } from "@curolia/plugin-contract";
import { pinMetadataRowByField } from "@curolia/plugin-contract";
import type { OsmPoiTagFamilies } from "./config";

export type OsmPoiSubtitlePart =
  | { kind: "text"; text: string }
  | { kind: "wheelchair_friendly" }
  | { kind: "wheelchair_limited" }
  | { kind: "wheelchair_no" }
  | { kind: "dogs_welcome" }
  | { kind: "no_dogs" };

export type OsmPoiPinSubtitle = {
  parts: OsmPoiSubtitlePart[];
};

function readPlaceCategories(rows: PinMetadataRow[]): {
  food: boolean;
  outdoor: boolean;
} {
  const row = pinMetadataRowByField(rows, "place_categories");
  if (row?.value && "food" in row.value && "outdoor" in row.value) {
    return {
      food: row.value.food,
      outdoor: row.value.outdoor,
    };
  }
  return { food: false, outdoor: false };
}

/** Build subtitle parts from normalized `pin_metadata` rows. */
export function osmPoiSubtitleFromMetadata(
  rows: PinMetadataRow[],
  families: OsmPoiTagFamilies,
): OsmPoiPinSubtitle | null {
  const parts: OsmPoiSubtitlePart[] = [];
  const categories = readPlaceCategories(rows);

  const placeTypeRow = pinMetadataRowByField(rows, "place_type");
  if (placeTypeRow?.field_key === "place_type") {
    const showType =
      (families.food && categories.food) ||
      (families.outdoor && categories.outdoor) ||
      (families.food &&
        families.outdoor &&
        !categories.food &&
        !categories.outdoor &&
        !families.accessibility);
    if (showType) {
      parts.push({ kind: "text", text: placeTypeRow.value.label });
    }
  }

  if (families.accessibility) {
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

  if (families.food) {
    const cuisine = pinMetadataRowByField(rows, "cuisine");
    if (cuisine?.field_key === "cuisine") {
      const label = cuisine.value.label;
      if (!parts.some((part) => part.kind === "text" && part.text === label)) {
        parts.push({ kind: "text", text: label });
      }
    }
  }

  if (parts.length === 0) return null;
  return { parts };
}
