import {
  isPinMetadataFieldKey,
  PIN_METADATA_DISPLAY_ORDER,
  pinMetadataFieldLabel,
  type PinMetadataDisplayItem,
  type PinMetadataFieldKey,
} from "./pin-metadata";

/** Metadata fields owners can toggle for pin display (`place_categories` is internal). */
export const PIN_METADATA_SHOW_FIELD_KEYS = PIN_METADATA_DISPLAY_ORDER;

export type PinMetadataShowFieldKey =
  (typeof PIN_METADATA_SHOW_FIELD_KEYS)[number];

export type PinMetadataShowSettings = PinMetadataShowFieldKey[];

export type PinMetadataShowGroup = {
  label: string;
  keys: readonly PinMetadataShowFieldKey[];
};

/** Fields the app may surface on the compact pin subtitle when enabled. */
export const PIN_METADATA_SUBTITLE_FIELD_KEYS = [
  "place_type",
  "cuisine",
  "wheelchair_access",
  "dog_policy",
] as const satisfies readonly PinMetadataShowFieldKey[];

export type PinMetadataSubtitleFieldKey =
  (typeof PIN_METADATA_SUBTITLE_FIELD_KEYS)[number];

export const PIN_METADATA_SHOW_GROUPS: readonly PinMetadataShowGroup[] = [
  {
    label: "Place",
    keys: [
      "place_name",
      "place_type",
      "brand",
      "operator",
      "cuisine",
      "dietary_options",
    ],
  },
  {
    label: "Accessibility",
    keys: ["wheelchair_access", "dog_policy"],
  },
  {
    label: "Contact",
    keys: ["opening_hours", "phone", "website", "email"],
  },
] as const;

const DEFAULT_SHOW_SETTINGS: PinMetadataShowSettings = [
  ...PIN_METADATA_SHOW_FIELD_KEYS,
];

export function isPinMetadataShowFieldKey(
  value: string,
): value is PinMetadataShowFieldKey {
  return (PIN_METADATA_SHOW_FIELD_KEYS as readonly string[]).includes(value);
}

/** Value → label map for multi-select `Select` `items`. */
export function pinMetadataShowSelectItems(): Record<
  PinMetadataShowFieldKey,
  string
> {
  return Object.fromEntries(
    PIN_METADATA_SHOW_FIELD_KEYS.map((key) => [
      key,
      pinMetadataFieldLabel(key),
    ]),
  ) as Record<PinMetadataShowFieldKey, string>;
}

const PIN_METADATA_SHOW_SUMMARY_VISIBLE_LABELS = 3;

function orderedPinMetadataShowLabels(
  keys: PinMetadataShowFieldKey[],
  items: Record<PinMetadataShowFieldKey, string>,
): string[] {
  return PIN_METADATA_SHOW_FIELD_KEYS.filter((key) => keys.includes(key)).map(
    (key) => items[key],
  );
}

/** Compact label for multi-select trigger when many metadata fields are chosen. */
export function pinMetadataShowSelectSummary(
  selected: unknown,
  items: Record<PinMetadataShowFieldKey, string> = pinMetadataShowSelectItems(),
): string | null {
  if (!Array.isArray(selected) || selected.length === 0) return null;
  const keys = selected.filter(isPinMetadataShowFieldKey);
  if (keys.length === 0) return null;
  if (keys.length >= PIN_METADATA_SHOW_FIELD_KEYS.length) return "All fields";

  const labels = orderedPinMetadataShowLabels(keys, items);
  if (labels.length === 1) return labels[0];
  if (labels.length <= PIN_METADATA_SHOW_SUMMARY_VISIBLE_LABELS) {
    return labels.join(", ");
  }

  const visible = labels.slice(0, PIN_METADATA_SHOW_SUMMARY_VISIBLE_LABELS);
  const more = labels.length - PIN_METADATA_SHOW_SUMMARY_VISIBLE_LABELS;
  const moreLabel =
    more === 1 ? "1 more field selected" : `${more} more fields selected`;
  return `${visible.join(", ")}, ${moreLabel}`;
}

export function defaultPinMetadataShowSettings(): PinMetadataShowSettings {
  return [...DEFAULT_SHOW_SETTINGS];
}

function normalizeFieldList(raw: unknown): PinMetadataShowSettings {
  if (!Array.isArray(raw)) return [];
  const enabled = new Set<PinMetadataShowFieldKey>();
  for (const entry of raw) {
    if (typeof entry === "string" && isPinMetadataShowFieldKey(entry)) {
      enabled.add(entry);
    }
  }
  return PIN_METADATA_SHOW_FIELD_KEYS.filter((key) => enabled.has(key));
}

/** Resolve per-map `maps.show_pin_metadata` JSON (`{ fields: string[] }`). */
export function resolveMapPinMetadataShow(
  raw: unknown,
): PinMetadataShowSettings {
  if (Array.isArray(raw)) {
    return normalizeFieldList(raw);
  }
  if (!raw || typeof raw !== "object") {
    return defaultPinMetadataShowSettings();
  }
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.fields)) {
    return normalizeFieldList(o.fields);
  }
  return defaultPinMetadataShowSettings();
}

export function pinMetadataShowSettingsEqual(
  a: PinMetadataShowSettings,
  b: PinMetadataShowSettings,
): boolean {
  if (a.length !== b.length) return false;
  const enabled = new Set(a);
  return b.every((key) => enabled.has(key));
}

export function normalizePinMetadataShowSettings(
  settings: PinMetadataShowSettings,
): PinMetadataShowSettings {
  return normalizeFieldList(settings);
}

/** JSON persisted on `maps.show_pin_metadata`. */
export function pinMetadataShowSettingsForStorage(
  settings: PinMetadataShowSettings,
): { fields: PinMetadataShowFieldKey[] } {
  return { fields: normalizePinMetadataShowSettings(settings) };
}

export function isPinMetadataSubtitleField(
  fieldKey: PinMetadataFieldKey,
): fieldKey is PinMetadataSubtitleFieldKey {
  return (PIN_METADATA_SUBTITLE_FIELD_KEYS as readonly string[]).includes(
    fieldKey,
  );
}

/** Whether any enabled show-metadata fields can appear in the detail box. */
export function hasPinMetadataDetailDisplayEnabled(
  settings: PinMetadataShowSettings,
): boolean {
  return settings.some((key) => !isPinMetadataSubtitleField(key));
}

export function isPinMetadataFieldShown(
  fieldKey: PinMetadataFieldKey,
  settings: PinMetadataShowSettings,
): boolean {
  if (fieldKey === "place_categories") return false;
  if (!isPinMetadataFieldKey(fieldKey)) return false;
  return settings.includes(fieldKey);
}

/** Whether a grouped metadata item should render for the map display settings. */
export function isPinMetadataItemVisible(
  item: PinMetadataDisplayItem,
  settings: PinMetadataShowSettings,
): boolean {
  return isPinMetadataFieldShown(item.fieldKey, settings);
}

/** Filter items for the pin detail metadata box (excludes subtitle fields). */
export function filterPinMetadataForDetailDisplay(
  items: PinMetadataDisplayItem[],
  settings: PinMetadataShowSettings,
): PinMetadataDisplayItem[] {
  return items.filter(
    (item) =>
      isPinMetadataItemVisible(item, settings) &&
      !isPinMetadataSubtitleField(item.fieldKey),
  );
}
