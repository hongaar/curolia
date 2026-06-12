import { pinLocationLabel } from "./_services/geocoding/pin-geocode.ts";
import { absoluteAppUrl, pinDetailPath } from "./pin-detail-url.ts";

export type IcalPinRow = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  geocode: unknown;
  location_label_detail: string;
  lat: number;
  lng: number;
  date: string | null;
  end_date: string | null;
};

export function escapeIcsText(s: string): string {
  return s
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "");
}

/** Fold to ~75 octets per RFC 5545 (ASCII-safe for our charset). */
export function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ` ${rest.slice(75)}`;
  }
  if (rest.length) parts.push(rest);
  return parts.join("\r\n");
}

function ymdToIcsDate(ymd: string): string {
  return ymd.replaceAll("-", "");
}

/** Exclusive calendar end for VALUE=DATE (day after inclusive last day). */
function exclusiveEndFromInclusive(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d + 1);
  const dt = new Date(ms);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function formatUtcDtStamp(d: Date): string {
  return (
    d.toISOString().replaceAll("-", "").replaceAll(":", "").split(".")[0] + "Z"
  );
}

export function buildCalendar(params: {
  mapName: string;
  mapId: string;
  profileSlug: string;
  mapSlug: string;
  siteOrigin: string;
  pins: IcalPinRow[];
}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Curolia//iCalendar feed//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(params.mapName)}`,
  ];
  const dtstamp = formatUtcDtStamp(new Date());
  for (const t of params.pins) {
    if (!t.date) continue;
    const summary = (t.title?.trim() || "Pin").slice(0, 200);
    const desc = t.description?.trim() ?? "";
    const location = pinLocationLabel({
      geocode: t.geocode,
      location_label_detail: t.location_label_detail,
    });
    const start = ymdToIcsDate(t.date);
    const lastInclusive =
      t.end_date && t.end_date >= t.date ? t.end_date : t.date;
    const endExclusive = exclusiveEndFromInclusive(lastInclusive);
    const pinUrl = absoluteAppUrl(
      params.siteOrigin,
      pinDetailPath(params.profileSlug, params.mapSlug, t.slug),
    );
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${t.id}@curolia-${params.mapId}`));
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${start}`);
    lines.push(`DTEND;VALUE=DATE:${endExclusive}`);
    lines.push(foldLine(`SUMMARY:${escapeIcsText(summary)}`));
    if (desc.length > 0)
      lines.push(foldLine(`DESCRIPTION:${escapeIcsText(desc)}`));
    if (location) lines.push(foldLine(`LOCATION:${escapeIcsText(location)}`));
    lines.push(foldLine(`URL:${pinUrl}`));
    lines.push(foldLine(`GEO:${t.lat};${t.lng}`));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
