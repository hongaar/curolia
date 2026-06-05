/** Canonical field keys plugins may publish on `pin_metadata`. */
export const PIN_METADATA_FIELD_KEYS = [
  "place_name",
  "place_type",
  "cuisine",
  "dietary_options",
  "wheelchair_access",
  "dog_policy",
  "brand",
  "operator",
  "opening_hours",
  "phone",
  "website",
  "email",
  "place_categories",
] as const;

export type PinMetadataFieldKey = (typeof PIN_METADATA_FIELD_KEYS)[number];

export type PinMetadataPhoneValue = {
  tel: string;
  display?: string;
};

export type PinMetadataWebsiteValue = {
  url: string;
  label?: string;
};

export type PinMetadataOpeningHoursValue = {
  raw: string;
  display: string;
};

export type PinMetadataEmailValue = {
  email: string;
  label?: string;
};

export type PinMetadataLabelValue = {
  label: string;
};

export type PinMetadataWheelchairAccessValue = {
  level: "yes" | "designated" | "limited" | "no";
};

export type PinMetadataDogPolicyValue = {
  level: "yes" | "leashed" | "no";
};

export type PinMetadataDietaryOptionsValue = {
  labels: string[];
};

/** Hint for subtitle filtering (which tag families matched at sync time). */
export type PinMetadataPlaceCategoriesValue = {
  food: boolean;
  outdoor: boolean;
};

export type PinMetadataValueByKey = {
  phone: PinMetadataPhoneValue;
  website: PinMetadataWebsiteValue;
  opening_hours: PinMetadataOpeningHoursValue;
  email: PinMetadataEmailValue;
  place_name: PinMetadataLabelValue;
  place_type: PinMetadataLabelValue;
  cuisine: PinMetadataLabelValue;
  brand: PinMetadataLabelValue;
  operator: PinMetadataLabelValue;
  wheelchair_access: PinMetadataWheelchairAccessValue;
  dog_policy: PinMetadataDogPolicyValue;
  dietary_options: PinMetadataDietaryOptionsValue;
  place_categories: PinMetadataPlaceCategoriesValue;
};

export type PinMetadataUpsert<
  K extends PinMetadataFieldKey = PinMetadataFieldKey,
> = {
  fieldKey: K;
  value: PinMetadataValueByKey[K];
};

export type PinMetadataRow = {
  id: string;
  map_id: string;
  pin_id: string;
  field_key: PinMetadataFieldKey;
  source_plugin_id: string;
  value: PinMetadataValueByKey[PinMetadataFieldKey];
  created_at: string;
  updated_at: string;
};

type PinMetadataDisplayItemBase = {
  sourcePluginId: string;
  updatedAt: string;
};

export type PinMetadataDisplayItem =
  | (PinMetadataDisplayItemBase & {
      fieldKey: "phone";
      value: PinMetadataPhoneValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "website";
      value: PinMetadataWebsiteValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "opening_hours";
      value: PinMetadataOpeningHoursValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "email";
      value: PinMetadataEmailValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "place_name";
      value: PinMetadataLabelValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "place_type";
      value: PinMetadataLabelValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "cuisine";
      value: PinMetadataLabelValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "brand";
      value: PinMetadataLabelValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "operator";
      value: PinMetadataLabelValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "wheelchair_access";
      value: PinMetadataWheelchairAccessValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "dog_policy";
      value: PinMetadataDogPolicyValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "dietary_options";
      value: PinMetadataDietaryOptionsValue;
    })
  | (PinMetadataDisplayItemBase & {
      fieldKey: "place_categories";
      value: PinMetadataPlaceCategoriesValue;
    });

const FIELD_LABELS: Record<PinMetadataFieldKey, string> = {
  place_name: "Name",
  place_type: "Type",
  cuisine: "Cuisine",
  dietary_options: "Dietary",
  wheelchair_access: "Accessibility",
  dog_policy: "Dogs",
  brand: "Brand",
  operator: "Operator",
  opening_hours: "Hours",
  phone: "Phone",
  website: "Website",
  email: "Email",
  place_categories: "Categories",
};

export function pinMetadataFieldLabel(key: PinMetadataFieldKey): string {
  return FIELD_LABELS[key];
}

export const PIN_METADATA_DISPLAY_ORDER: readonly PinMetadataFieldKey[] = [
  "place_name",
  "place_type",
  "cuisine",
  "dietary_options",
  "wheelchair_access",
  "dog_policy",
  "brand",
  "operator",
  "opening_hours",
  "phone",
  "website",
  "email",
];

export function isPinMetadataFieldKey(
  value: string,
): value is PinMetadataFieldKey {
  return (PIN_METADATA_FIELD_KEYS as readonly string[]).includes(value);
}

function parseLabelValue(raw: unknown): PinMetadataLabelValue | null {
  if (!raw || typeof raw !== "object") return null;
  const label = (raw as Record<string, unknown>).label;
  if (typeof label !== "string" || !label.trim()) return null;
  return { label: label.trim() };
}

function parsePhoneValue(raw: unknown): PinMetadataPhoneValue | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.tel !== "string" || !o.tel.trim()) return null;
  return {
    tel: o.tel.trim(),
    display: typeof o.display === "string" ? o.display.trim() : undefined,
  };
}

function parseWebsiteValue(raw: unknown): PinMetadataWebsiteValue | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.url !== "string" || !o.url.trim()) return null;
  return {
    url: o.url.trim(),
    label: typeof o.label === "string" ? o.label.trim() : undefined,
  };
}

function parseOpeningHoursValue(
  raw: unknown,
): PinMetadataOpeningHoursValue | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.raw !== "string" || !o.raw.trim()) return null;
  const rawText = o.raw.trim();
  const display =
    typeof o.display === "string" && o.display.trim()
      ? o.display.trim()
      : formatOpeningHoursDisplay(rawText);
  return { raw: rawText, display };
}

function parseEmailValue(raw: unknown): PinMetadataEmailValue | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.email !== "string" || !o.email.trim()) return null;
  return {
    email: o.email.trim(),
    label: typeof o.label === "string" ? o.label.trim() : undefined,
  };
}

function parseWheelchairAccessValue(
  raw: unknown,
): PinMetadataWheelchairAccessValue | null {
  if (!raw || typeof raw !== "object") return null;
  const level = (raw as Record<string, unknown>).level;
  if (
    level !== "yes" &&
    level !== "designated" &&
    level !== "limited" &&
    level !== "no"
  ) {
    return null;
  }
  return { level };
}

function parseDogPolicyValue(raw: unknown): PinMetadataDogPolicyValue | null {
  if (!raw || typeof raw !== "object") return null;
  const level = (raw as Record<string, unknown>).level;
  if (level !== "yes" && level !== "leashed" && level !== "no") return null;
  return { level };
}

function parseDietaryOptionsValue(
  raw: unknown,
): PinMetadataDietaryOptionsValue | null {
  if (!raw || typeof raw !== "object") return null;
  const labels = (raw as Record<string, unknown>).labels;
  if (!Array.isArray(labels)) return null;
  const parsed = labels
    .filter((label): label is string => typeof label === "string")
    .map((label) => label.trim())
    .filter(Boolean);
  if (parsed.length === 0) return null;
  return { labels: parsed };
}

export function parsePinMetadataValue(
  fieldKey: PinMetadataFieldKey,
  raw: unknown,
): PinMetadataValueByKey[PinMetadataFieldKey] | null {
  switch (fieldKey) {
    case "phone":
      return parsePhoneValue(raw);
    case "website":
      return parseWebsiteValue(raw);
    case "opening_hours":
      return parseOpeningHoursValue(raw);
    case "email":
      return parseEmailValue(raw);
    case "place_name":
    case "place_type":
    case "cuisine":
    case "brand":
    case "operator":
      return parseLabelValue(raw);
    case "wheelchair_access":
      return parseWheelchairAccessValue(raw);
    case "dog_policy":
      return parseDogPolicyValue(raw);
    case "dietary_options":
      return parseDietaryOptionsValue(raw);
    case "place_categories": {
      if (!raw || typeof raw !== "object") return null;
      const o = raw as Record<string, unknown>;
      if (typeof o.food !== "boolean" || typeof o.outdoor !== "boolean") {
        return null;
      }
      return { food: o.food, outdoor: o.outdoor };
    }
    default:
      return null;
  }
}

export function parsePinMetadataRow(row: {
  id: string;
  map_id: string;
  pin_id: string;
  field_key: string;
  source_plugin_id: string;
  value: unknown;
  created_at: string;
  updated_at: string;
}): PinMetadataRow | null {
  if (!isPinMetadataFieldKey(row.field_key)) return null;
  const value = parsePinMetadataValue(row.field_key, row.value);
  if (!value) return null;
  return {
    id: row.id,
    map_id: row.map_id,
    pin_id: row.pin_id,
    field_key: row.field_key,
    source_plugin_id: row.source_plugin_id,
    value,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function groupPinMetadataForDisplay(
  rows: PinMetadataRow[],
): PinMetadataDisplayItem[] {
  const best = new Map<PinMetadataFieldKey, PinMetadataRow>();
  for (const row of rows) {
    const prev = best.get(row.field_key);
    if (
      !prev ||
      new Date(row.updated_at).getTime() > new Date(prev.updated_at).getTime()
    ) {
      best.set(row.field_key, row);
    }
  }
  return PIN_METADATA_DISPLAY_ORDER.flatMap((fieldKey) => {
    const row = best.get(fieldKey);
    if (!row) return [];
    return [
      {
        fieldKey,
        value: row.value,
        sourcePluginId: row.source_plugin_id,
        updatedAt: row.updated_at,
      } as PinMetadataDisplayItem,
    ];
  });
}

export function pinMetadataRowByField<K extends PinMetadataFieldKey>(
  rows: PinMetadataRow[],
  fieldKey: K,
):
  | (PinMetadataRow & {
      field_key: K;
      value: PinMetadataValueByKey[K];
    })
  | null {
  let best: PinMetadataRow | null = null;
  for (const row of rows) {
    if (row.field_key !== fieldKey) continue;
    if (
      !best ||
      new Date(row.updated_at).getTime() > new Date(best.updated_at).getTime()
    ) {
      best = row;
    }
  }
  if (!best || best.field_key !== fieldKey) return null;
  return best as PinMetadataRow & {
    field_key: K;
    value: PinMetadataValueByKey[K];
  };
}

export function formatOpeningHoursDisplay(raw: string): string {
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");
}

export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

/** Human-friendly website label for pin metadata (href keeps the full URL). */
export function formatPinMetadataWebsiteLabel(
  url: string,
  maxPathSegments = 2,
): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "");

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    if (!pathname || pathname === "/") {
      return host;
    }

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= maxPathSegments) {
      return `${host}/${segments.join("/")}`;
    }

    const shown = segments.slice(0, maxPathSegments).join("/");
    return `${host}/${shown}/…`;
  } catch {
    return url
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "");
  }
}

/** Display label for a website metadata value. */
export function pinMetadataWebsiteDisplayLabel(
  value: PinMetadataWebsiteValue,
): string {
  if (value.label?.trim()) return value.label.trim();
  return formatPinMetadataWebsiteLabel(value.url);
}

export function normalizePhoneTel(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits || digits === "+") return null;
  return digits;
}
