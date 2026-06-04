import { inclusiveDayCount, localTodayYmd, parseYmd } from "./open-meteo-dates";
import {
  summarizeDailySeries,
  type DailyWeatherSeries,
  type PeriodWeatherSummary,
} from "./open-meteo-weather";

const DAILY_VARS =
  "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code";
const MAX_PERIOD_DAYS = 366;

type OpenMeteoDailyResponse = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    weather_code?: number[];
  };
};

function archiveCutoffYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function apiUrl(endYmd: string): string {
  return endYmd <= archiveCutoffYmd()
    ? "https://archive-api.open-meteo.com/v1/archive"
    : "https://api.open-meteo.com/v1/forecast";
}

function parseDailyResponse(
  data: OpenMeteoDailyResponse,
): DailyWeatherSeries | null {
  const daily = data.daily;
  if (!daily?.time?.length) return null;
  const tempMax = daily.temperature_2m_max ?? [];
  const tempMin = daily.temperature_2m_min ?? [];
  const precip = daily.precipitation_sum ?? [];
  const codes = daily.weather_code ?? [];
  return {
    dates: daily.time,
    tempMaxC: tempMax,
    tempMinC: tempMin,
    precipSumMm: precip,
    weatherCode: codes,
  };
}

export async function fetchPeriodWeatherSummary(
  lat: number,
  lng: number,
  startYmd: string,
  endYmd: string,
): Promise<PeriodWeatherSummary | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (startYmd > endYmd) return null;
  if (endYmd > localTodayYmd()) return null;

  let start = startYmd;
  const end = endYmd;
  if (inclusiveDayCount(start, end) > MAX_PERIOD_DAYS) {
    const endParts = parseYmd(end);
    if (!endParts) return null;
    const clampStart = new Date(
      endParts.y,
      endParts.m - 1,
      endParts.d - (MAX_PERIOD_DAYS - 1),
    );
    const y = clampStart.getFullYear();
    const m = String(clampStart.getMonth() + 1).padStart(2, "0");
    const d = String(clampStart.getDate()).padStart(2, "0");
    start = `${y}-${m}-${d}`;
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: start,
    end_date: end,
    daily: DAILY_VARS,
    temperature_unit: "celsius",
    precipitation_unit: "mm",
    timezone: "auto",
  });

  const res = await fetch(`${apiUrl(end)}?${params}`);
  if (!res.ok) return null;
  const json = (await res.json()) as OpenMeteoDailyResponse;
  const series = parseDailyResponse(json);
  if (!series) return null;
  return summarizeDailySeries(series, startYmd, endYmd);
}
