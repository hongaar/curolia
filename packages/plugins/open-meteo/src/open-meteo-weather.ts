import { inclusiveDayCount } from "./open-meteo-dates";

export type DailyWeatherSeries = {
  dates: string[];
  tempMaxC: number[];
  tempMinC: number[];
  precipSumMm: number[];
  weatherCode: number[];
};

export type PeriodWeatherSummary = {
  dayCount: number;
  isRange: boolean;
  meanTempC: number;
  minTempC: number;
  maxTempC: number;
  totalPrecipMm: number;
  meanDailyPrecipMm: number;
  dominantWeatherCode: number;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function dailyMeanTemp(max: number, min: number): number {
  return (max + min) / 2;
}

/** Mode of weather codes (ties → lower code). */
export function dominantWeatherCode(codes: number[]): number {
  if (codes.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const c of codes) {
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best = codes[0]!;
  let bestCount = 0;
  for (const [code, count] of counts) {
    if (count > bestCount || (count === bestCount && code < best)) {
      best = code;
      bestCount = count;
    }
  }
  return best;
}

export function summarizeDailySeries(
  series: DailyWeatherSeries,
  startYmd: string,
  endYmd: string,
): PeriodWeatherSummary | null {
  const n = series.dates.length;
  if (n === 0) return null;

  const dayMeans: number[] = [];
  let minTemp = Infinity;
  let maxTemp = -Infinity;
  let totalPrecip = 0;

  for (let i = 0; i < n; i++) {
    const tMax = series.tempMaxC[i];
    const tMin = series.tempMinC[i];
    if (
      tMax == null ||
      tMin == null ||
      Number.isNaN(tMax) ||
      Number.isNaN(tMin)
    ) {
      continue;
    }
    const mean = dailyMeanTemp(tMax, tMin);
    dayMeans.push(mean);
    minTemp = Math.min(minTemp, tMin);
    maxTemp = Math.max(maxTemp, tMax);
    const p = series.precipSumMm[i];
    if (p != null && !Number.isNaN(p)) totalPrecip += p;
  }

  if (dayMeans.length === 0) return null;

  const meanTemp = dayMeans.reduce((a, b) => a + b, 0) / dayMeans.length;
  const dayCount = inclusiveDayCount(startYmd, endYmd);
  const isRange = dayCount > 1;

  return {
    dayCount,
    isRange,
    meanTempC: round1(meanTemp),
    minTempC: round1(minTemp),
    maxTempC: round1(maxTemp),
    totalPrecipMm: round1(totalPrecip),
    meanDailyPrecipMm: round1(totalPrecip / dayMeans.length),
    dominantWeatherCode: dominantWeatherCode(series.weatherCode),
  };
}

/** Short WMO weather code label (Open-Meteo). */
export function weatherCodeLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Mixed";
}

export function weatherCodeEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 86) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

/** One-line weather fragment for pin detail subtitle. */
export function formatOpenMeteoSubtitle(summary: PeriodWeatherSummary): string {
  const emoji = weatherCodeEmoji(summary.dominantWeatherCode);
  const label = weatherCodeLabel(summary.dominantWeatherCode);
  const temp = Math.round(summary.maxTempC);
  return `${emoji} ${label} · ${temp}°C`;
}

/** Subtitle from a cached `plugin_entity_data` payload. */
export function formatOpenMeteoSubtitleFromPayload(payload: {
  weatherCode: number;
  maxTempC: number;
}): string {
  const emoji = weatherCodeEmoji(payload.weatherCode);
  const label = weatherCodeLabel(payload.weatherCode);
  const temp = Math.round(payload.maxTempC);
  return `${emoji} ${label} · ${temp}°C`;
}
