import {
  isPinMetadataFieldKey,
  PIN_METADATA_DISPLAY_ORDER,
  type PinMetadataDisplayItem,
  type PinMetadataFieldKey,
} from "./pin-metadata";

/** Metadata fields that are never shown on pins (redundant with the pin title). */
export const PIN_METADATA_ALWAYS_HIDDEN_FIELD_KEYS = [
  "place_name",
  "brand",
  "operator",
] as const satisfies readonly PinMetadataFieldKey[];

export type PinMetadataAlwaysHiddenFieldKey =
  (typeof PIN_METADATA_ALWAYS_HIDDEN_FIELD_KEYS)[number];

/** Metadata fields map editors can add / edit / remove on a pin. */
export const PIN_METADATA_EDITABLE_FIELD_KEYS =
  PIN_METADATA_DISPLAY_ORDER.filter(
    (key) =>
      !(PIN_METADATA_ALWAYS_HIDDEN_FIELD_KEYS as readonly string[]).includes(
        key,
      ),
  ) as Exclude<
    PinMetadataFieldKey,
    PinMetadataAlwaysHiddenFieldKey | "place_categories"
  >[];

export type PinMetadataEditableFieldKey =
  (typeof PIN_METADATA_EDITABLE_FIELD_KEYS)[number];

export type PinMetadataEditableGroup = {
  label: string;
  keys: readonly PinMetadataEditableFieldKey[];
};

export const PIN_METADATA_EDITABLE_GROUPS: readonly PinMetadataEditableGroup[] =
  [
    { label: "Place", keys: ["place_type", "cuisine", "dietary_options"] },
    { label: "Accessibility", keys: ["wheelchair_access", "dog_policy"] },
    { label: "Contact", keys: ["opening_hours", "phone", "website", "email"] },
  ] as const;

export function isPinMetadataEditableFieldKey(
  value: string,
): value is PinMetadataEditableFieldKey {
  return (PIN_METADATA_EDITABLE_FIELD_KEYS as readonly string[]).includes(
    value,
  );
}

/** Fields the app surfaces on the compact pin subtitle. */
export const PIN_METADATA_SUBTITLE_FIELD_KEYS = [
  "place_type",
  "cuisine",
  "wheelchair_access",
  "dog_policy",
] as const satisfies readonly PinMetadataEditableFieldKey[];

export type PinMetadataSubtitleFieldKey =
  (typeof PIN_METADATA_SUBTITLE_FIELD_KEYS)[number];

export function isPinMetadataSubtitleField(
  fieldKey: PinMetadataFieldKey,
): fieldKey is PinMetadataSubtitleFieldKey {
  return (PIN_METADATA_SUBTITLE_FIELD_KEYS as readonly string[]).includes(
    fieldKey,
  );
}

/** Whether a metadata field renders on pins at all. */
export function isPinMetadataFieldShown(
  fieldKey: PinMetadataFieldKey,
): boolean {
  if (!isPinMetadataFieldKey(fieldKey)) return false;
  return isPinMetadataEditableFieldKey(fieldKey);
}

/** Filter items for the pin detail metadata box (excludes subtitle fields). */
export function filterPinMetadataForDetailDisplay(
  items: PinMetadataDisplayItem[],
): PinMetadataDisplayItem[] {
  return items.filter(
    (item) =>
      isPinMetadataFieldShown(item.fieldKey) &&
      !isPinMetadataSubtitleField(item.fieldKey),
  );
}
