/** Format YYYY-MM-DD in the user's local calendar (avoids UTC parsing pitfalls). */
export function formatLocalCalendarDay(ymd: string): string {
  return formatDayMonthYear(ymd);
}

type YmdParts = { y: number; m: number; d: number };

function parseYmd(ymd: string): YmdParts | null {
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return { y, m, d };
}

function localDateFromYmd(ymd: string): Date | null {
  const p = parseYmd(ymd);
  if (!p) return null;
  return new Date(p.y, p.m - 1, p.d);
}

function formatDay(ymd: string, locale?: Intl.LocalesArgument): string {
  const dt = localDateFromYmd(ymd);
  if (!dt) return ymd;
  return dt.toLocaleDateString(locale, { day: "numeric" });
}

function formatDayMonth(ymd: string, locale?: Intl.LocalesArgument): string {
  const dt = localDateFromYmd(ymd);
  if (!dt) return ymd;
  return dt.toLocaleDateString(locale, { day: "numeric", month: "long" });
}

function formatDayMonthYear(
  ymd: string,
  locale?: Intl.LocalesArgument,
): string {
  const dt = localDateFromYmd(ymd);
  if (!dt) return ymd;
  return dt.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthYear(ymd: string, locale?: Intl.LocalesArgument): string {
  const dt = localDateFromYmd(ymd);
  if (!dt) return ymd;
  return dt.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

export function formatPinDateRange(
  date: string | null | undefined,
  endDate: string | null | undefined,
  locale?: Intl.LocalesArgument,
): string {
  if (!date) return "";
  if (!endDate || endDate === date) return formatDayMonthYear(date, locale);

  const start = parseYmd(date);
  const end = parseYmd(endDate);
  if (!start || !end) {
    return `${formatDayMonthYear(date, locale)} – ${formatDayMonthYear(endDate, locale)}`;
  }

  if (start.y === end.y && start.m === end.m) {
    return `${formatDay(date, locale)} – ${formatDay(endDate, locale)} ${formatMonthYear(date, locale)}`;
  }

  if (start.y === end.y) {
    return `${formatDayMonth(date, locale)} – ${formatDayMonthYear(endDate, locale)}`;
  }

  return `${formatDayMonthYear(date, locale)} – ${formatDayMonthYear(endDate, locale)}`;
}

/** Pin detail subtitle: location (left) and date range, middle dot between parts. */
export function formatPinDetailSubtitle(
  locationLabel: string | null | undefined,
  date: string | null | undefined,
  endDate: string | null | undefined,
): string {
  const loc = locationLabel?.trim() ?? "";
  const datePart = formatPinDateRange(date, endDate);
  if (loc && datePart) return `${loc} · ${datePart}`;
  return loc || datePart;
}

/** One line: optional date range plus coordinates (middle dot only between present parts). */
export function formatPinLocationLine(
  date: string | null | undefined,
  endDate: string | null | undefined,
  lat: number,
  lng: number,
  coordDecimals = 5,
): string {
  const datePart = formatPinDateRange(date, endDate);
  const coords = `${lat.toFixed(coordDecimals)}, ${lng.toFixed(coordDecimals)}`;
  return datePart ? `${datePart} · ${coords}` : coords;
}

export function formatPinMetadataTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** True when the row was edited after insert (strictly after `created_at`). */
export function pinWasModifiedAfterCreate(
  createdAt: string,
  updatedAt: string,
): boolean {
  return new Date(updatedAt).getTime() > new Date(createdAt).getTime();
}

export function localTodayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
