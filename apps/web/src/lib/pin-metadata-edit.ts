import {
  formatOpeningHoursDisplay,
  normalizePhoneTel,
  normalizeWebsiteUrl,
  pinMetadataWebsiteDisplayLabel,
  type PinMetadataEditableFieldKey,
  type PinMetadataValueByKey,
} from "@curolia/plugin-contract";

/** Flat string form state for one metadata field in the pin editor. */
export type PinMetadataDraft = {
  primary: string;
  secondary: string;
};

export const WHEELCHAIR_LEVEL_LABELS = {
  yes: "Wheelchair friendly",
  designated: "Designed for wheelchairs",
  limited: "Limited wheelchair access",
  no: "Not wheelchair accessible",
} as const satisfies Record<
  PinMetadataValueByKey["wheelchair_access"]["level"],
  string
>;

export const DOG_POLICY_LABELS = {
  yes: "Dogs welcome",
  leashed: "Dogs on a leash",
  no: "No dogs",
} as const satisfies Record<
  PinMetadataValueByKey["dog_policy"]["level"],
  string
>;

export function emptyPinMetadataDraft(
  fieldKey: PinMetadataEditableFieldKey,
): PinMetadataDraft {
  if (fieldKey === "wheelchair_access" || fieldKey === "dog_policy") {
    return { primary: "yes", secondary: "" };
  }
  return { primary: "", secondary: "" };
}

export function pinMetadataDraftFromValue(
  fieldKey: PinMetadataEditableFieldKey,
  value: PinMetadataValueByKey[PinMetadataEditableFieldKey],
): PinMetadataDraft {
  const v = value as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === "string" ? x : "");
  switch (fieldKey) {
    case "place_type":
    case "cuisine":
      return { primary: str(v.label), secondary: "" };
    case "dietary_options":
      return {
        primary: Array.isArray(v.labels) ? v.labels.join(", ") : "",
        secondary: "",
      };
    case "wheelchair_access":
    case "dog_policy":
      return { primary: str(v.level), secondary: "" };
    case "opening_hours":
      return { primary: formatOpeningHoursDisplay(str(v.raw)), secondary: "" };
    case "phone":
      return { primary: str(v.display) || str(v.tel), secondary: "" };
    case "website":
      return { primary: str(v.url), secondary: str(v.label) };
    case "email":
      return { primary: str(v.email), secondary: "" };
  }
}

/** http(s) URL with a dotted hostname (or localhost); scheme optional in input. */
function parseWebsiteUrl(input: string): string | null {
  if (/\s/.test(input)) return null;
  const normalized = normalizeWebsiteUrl(input);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname;
    if (host !== "localhost" && !/^[^.]+(\.[^.]+)+$/.test(host)) return null;
    return normalized;
  } catch {
    return null;
  }
}

/** Validation message for a non-empty draft that does not parse. */
export function pinMetadataDraftError(
  fieldKey: PinMetadataEditableFieldKey,
  draft: PinMetadataDraft,
): string | null {
  if (!draft.primary.trim()) return null;
  if (pinMetadataValueFromDraft(fieldKey, draft)) return null;
  switch (fieldKey) {
    case "website":
      return "Enter a valid URL, e.g. https://example.com";
    case "email":
      return "Enter a valid email address.";
    case "phone":
      return "Enter a valid phone number.";
    default:
      return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse a draft into the stored JSON value; `null` when empty or invalid. */
export function pinMetadataValueFromDraft(
  fieldKey: PinMetadataEditableFieldKey,
  draft: PinMetadataDraft,
): PinMetadataValueByKey[PinMetadataEditableFieldKey] | null {
  const primary = draft.primary.trim();
  const secondary = draft.secondary.trim();
  switch (fieldKey) {
    case "place_type":
    case "cuisine":
      return primary ? { label: primary } : null;
    case "dietary_options": {
      const labels = primary
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean);
      return labels.length > 0 ? { labels } : null;
    }
    case "wheelchair_access":
      return primary in WHEELCHAIR_LEVEL_LABELS
        ? {
            level: primary as keyof typeof WHEELCHAIR_LEVEL_LABELS,
          }
        : null;
    case "dog_policy":
      return primary in DOG_POLICY_LABELS
        ? { level: primary as keyof typeof DOG_POLICY_LABELS }
        : null;
    case "opening_hours": {
      const raw = primary
        .split(/\n|;/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join("; ");
      return raw ? { raw, display: formatOpeningHoursDisplay(raw) } : null;
    }
    case "phone": {
      const tel = normalizePhoneTel(primary);
      return tel ? { tel, display: primary } : null;
    }
    case "website": {
      const url = parseWebsiteUrl(primary);
      if (!url) return null;
      return secondary ? { url, label: secondary } : { url };
    }
    case "email":
      return EMAIL_RE.test(primary) ? { email: primary } : null;
  }
}

/** One-line (or multiline for hours) summary for an editor row. */
export function pinMetadataValueSummary(
  fieldKey: PinMetadataEditableFieldKey,
  value: PinMetadataValueByKey[PinMetadataEditableFieldKey],
): string {
  switch (fieldKey) {
    case "place_type":
    case "cuisine":
      return (value as PinMetadataValueByKey["cuisine"]).label;
    case "dietary_options":
      return (value as PinMetadataValueByKey["dietary_options"]).labels.join(
        " · ",
      );
    case "wheelchair_access":
      return WHEELCHAIR_LEVEL_LABELS[
        (value as PinMetadataValueByKey["wheelchair_access"]).level
      ];
    case "dog_policy":
      return DOG_POLICY_LABELS[
        (value as PinMetadataValueByKey["dog_policy"]).level
      ];
    case "opening_hours":
      return (value as PinMetadataValueByKey["opening_hours"]).display;
    case "phone": {
      const phone = value as PinMetadataValueByKey["phone"];
      return phone.display || phone.tel;
    }
    case "website":
      return pinMetadataWebsiteDisplayLabel(
        value as PinMetadataValueByKey["website"],
      );
    case "email":
      return (value as PinMetadataValueByKey["email"]).email;
  }
}
