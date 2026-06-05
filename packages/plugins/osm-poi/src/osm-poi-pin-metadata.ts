import type { PinMetadataUpsert } from "@curolia/plugin-contract";
import {
  formatOpeningHoursDisplay,
  normalizePhoneTel,
  normalizeWebsiteUrl,
} from "@curolia/plugin-contract";
import { isFoodPoi, isOutdoorPoi, primaryPoiLabel } from "./osm-poi-format";

const PRIMARY_TYPE_KEYS = [
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "man_made",
  "historic",
  "office",
  "healthcare",
  "craft",
] as const;

const DIET_TAG_PREFIX = "diet:";

const CONSUMED_EXACT_KEYS = new Set([
  "name",
  "brand",
  "operator",
  "cuisine",
  "wheelchair",
  "dog",
  "phone",
  "mobile",
  "website",
  "url",
  "email",
  "opening_hours",
  "contact:phone",
  "contact:mobile",
  "contact:website",
  "contact:url",
  "contact:email",
  ...PRIMARY_TYPE_KEYS,
]);

const SKIP_FACT_PREFIXES = ["source:", "created_by", "fixme", "note"];

function firstTag(tags: Record<string, string>, keys: string[]): string | null {
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return null;
}

function titleCaseToken(token: string): string {
  const t = token.trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function formatTagValue(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

function formatCuisine(value: string): string {
  return value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .split(/[_\s]+/)
        .filter(Boolean)
        .map(titleCaseToken)
        .join(" "),
    )
    .join(", ");
}

function formatOsmTagKey(key: string): string {
  const withoutPrefix = key.includes(":") ? (key.split(":").pop() ?? key) : key;
  return formatTagValue(withoutPrefix.replace(/:/g, " "));
}

function parseWheelchairLevel(
  value: string | undefined,
): "yes" | "designated" | "limited" | "no" | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "yes") return "yes";
  if (v === "designated") return "designated";
  if (v === "limited") return "limited";
  if (v === "no") return "no";
  return null;
}

function parseDogLevel(
  value: string | undefined,
): "yes" | "leashed" | "no" | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v === "yes") return "yes";
  if (v === "leashed") return "leashed";
  if (v === "no") return "no";
  return null;
}

function isConsumedTagKey(key: string): boolean {
  if (CONSUMED_EXACT_KEYS.has(key)) return true;
  if (key.startsWith(DIET_TAG_PREFIX)) return true;
  return false;
}

function shouldSkipFactKey(key: string): boolean {
  if (isConsumedTagKey(key)) return true;
  return SKIP_FACT_PREFIXES.some(
    (prefix) => key === prefix || key.startsWith(prefix),
  );
}

function dietaryLabelsFromTags(tags: Record<string, string>): string[] {
  const labels: string[] = [];
  for (const [key, raw] of Object.entries(tags)) {
    if (!key.startsWith(DIET_TAG_PREFIX)) continue;
    const value = raw.trim().toLowerCase();
    if (value !== "yes" && value !== "only") continue;
    const slug = key.slice(DIET_TAG_PREFIX.length);
    if (!slug) continue;
    const label = formatTagValue(slug);
    if (value === "only") labels.push(`${label} only`);
    else labels.push(label);
  }
  return labels;
}

/** Map all useful OSM tags to provider-agnostic pin metadata fields. */
export function pinMetadataFromOsmTags(
  tags: Record<string, string>,
): PinMetadataUpsert[] {
  const fields: PinMetadataUpsert[] = [];

  const placeName = tags.name?.trim();
  if (placeName) {
    fields.push({
      fieldKey: "place_name",
      value: { label: placeName },
    });
  }

  const placeType = primaryPoiLabel(tags);
  if (placeType) {
    fields.push({
      fieldKey: "place_type",
      value: { label: placeType },
    });
  }

  const cuisineRaw = tags.cuisine?.trim();
  if (cuisineRaw) {
    fields.push({
      fieldKey: "cuisine",
      value: { label: formatCuisine(cuisineRaw) },
    });
  }

  const dietary = dietaryLabelsFromTags(tags);
  if (dietary.length > 0) {
    fields.push({
      fieldKey: "dietary_options",
      value: { labels: dietary },
    });
  }

  const wheelchair = parseWheelchairLevel(tags.wheelchair);
  if (wheelchair) {
    fields.push({
      fieldKey: "wheelchair_access",
      value: { level: wheelchair },
    });
  }

  const dog = parseDogLevel(tags.dog);
  if (dog) {
    fields.push({
      fieldKey: "dog_policy",
      value: { level: dog },
    });
  }

  const brand = tags.brand?.trim();
  if (brand) {
    fields.push({
      fieldKey: "brand",
      value: { label: brand },
    });
  }

  const operator = tags.operator?.trim();
  if (operator) {
    fields.push({
      fieldKey: "operator",
      value: { label: operator },
    });
  }

  const phoneRaw = firstTag(tags, [
    "phone",
    "contact:phone",
    "contact:mobile",
    "mobile",
  ]);
  if (phoneRaw) {
    const tel = normalizePhoneTel(phoneRaw);
    if (tel) {
      fields.push({
        fieldKey: "phone",
        value: {
          tel,
          display: phoneRaw !== tel ? phoneRaw : undefined,
        },
      });
    }
  }

  const websiteRaw = firstTag(tags, [
    "website",
    "contact:website",
    "url",
    "contact:url",
  ]);
  if (websiteRaw) {
    const url = normalizeWebsiteUrl(websiteRaw);
    if (url) {
      fields.push({
        fieldKey: "website",
        value: { url },
      });
    }
  }

  const emailRaw = firstTag(tags, ["email", "contact:email"]);
  if (emailRaw && emailRaw.includes("@")) {
    fields.push({
      fieldKey: "email",
      value: { email: emailRaw },
    });
  }

  const hoursRaw = tags.opening_hours?.trim();
  if (hoursRaw) {
    fields.push({
      fieldKey: "opening_hours",
      value: {
        raw: hoursRaw,
        display: formatOpeningHoursDisplay(hoursRaw),
      },
    });
  }

  const placeFacts: { label: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(tags)) {
    const value = raw.trim();
    if (!value || shouldSkipFactKey(key)) continue;
    placeFacts.push({
      label: formatOsmTagKey(key),
      value: formatTagValue(value),
    });
  }
  if (placeFacts.length > 0) {
    fields.push({
      fieldKey: "place_facts",
      value: { facts: placeFacts },
    });
  }

  fields.push({
    fieldKey: "place_categories",
    value: osmTagFamiliesForMetadata(tags),
  });

  return fields;
}

export function osmTagFamiliesForMetadata(tags: Record<string, string>): {
  food: boolean;
  outdoor: boolean;
} {
  return {
    food: isFoodPoi(tags),
    outdoor: isOutdoorPoi(tags),
  };
}
