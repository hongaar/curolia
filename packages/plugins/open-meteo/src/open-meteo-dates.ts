export function parseYmd(
  ymd: string,
): { y: number; m: number; d: number } | null {
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return { y, m, d };
}

export function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function localTodayYmd(): string {
  return toYmd(new Date());
}

/** Inclusive day count between two YYYY-MM-DD strings (calendar days). */
export function inclusiveDayCount(startYmd: string, endYmd: string): number {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  if (!start || !end) return 1;
  const a = new Date(start.y, start.m - 1, start.d);
  const b = new Date(end.y, end.m - 1, end.d);
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  return Math.max(1, diff + 1);
}

/** Pin period: `date` required; `endDate` defaults to `date`. */
export function resolvePinPeriodYmd(
  date: string | null | undefined,
  endDate: string | null | undefined,
): { start: string; end: string } | null {
  const start = date?.trim();
  if (!start) return null;
  const endRaw = endDate?.trim();
  const end = endRaw && endRaw >= start ? endRaw : start;
  return { start, end };
}

/** Clamp end to today when the pin extends into the future. */
export function clampPeriodEndToToday(period: {
  start: string;
  end: string;
}): { start: string; end: string } | null {
  const today = localTodayYmd();
  if (period.start > today) return null;
  if (period.end > today) return { start: period.start, end: today };
  return period;
}
