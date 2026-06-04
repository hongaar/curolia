import type { CurrentWeatherSnapshot } from "./open-meteo-api";
import type {
  OpenMeteoWeatherKind,
  OpenMeteoWeatherRequest,
} from "./open-meteo-dates";
import { localTodayYmd } from "./open-meteo-dates";
import type { PeriodWeatherSummary } from "./open-meteo-weather";

export const OPEN_METEO_CURRENT_WEATHER_MAX_AGE_MS = 30 * 60 * 1000;

/** Shape stored in `plugin_entity_data.data` for `plugin_type_id = open-meteo`. */
export type OpenMeteoPinPayload = {
  schemaVersion: 1;
  weatherKind: OpenMeteoWeatherKind;
  periodStart: string;
  periodEnd: string;
  lat: number;
  lng: number;
  fetchedAt: string;
  weatherCode: number;
  /** Highest daily maximum temperature (°C) across the pin period. */
  maxTempC?: number;
  /** Current temperature (°C) when `weatherKind` is `current`. */
  tempC?: number;
};

export function openMeteoPayloadFromSummary(
  summary: PeriodWeatherSummary,
  period: { start: string; end: string },
  lat: number,
  lng: number,
): OpenMeteoPinPayload {
  return {
    schemaVersion: 1,
    weatherKind: "historical",
    periodStart: period.start,
    periodEnd: period.end,
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    weatherCode: summary.dominantWeatherCode,
    maxTempC: summary.maxTempC,
  };
}

export function openMeteoPayloadFromCurrent(
  snapshot: CurrentWeatherSnapshot,
  period: { start: string; end: string },
  lat: number,
  lng: number,
): OpenMeteoPinPayload {
  return {
    schemaVersion: 1,
    weatherKind: "current",
    periodStart: period.start,
    periodEnd: period.end,
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    weatherCode: snapshot.weatherCode,
    tempC: snapshot.tempC,
  };
}

export function parseOpenMeteoPinPayload(
  raw: unknown,
): OpenMeteoPinPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.schemaVersion !== 1) return null;
  if (typeof o.periodStart !== "string" || typeof o.periodEnd !== "string") {
    return null;
  }
  if (typeof o.lat !== "number" || typeof o.lng !== "number") return null;
  if (typeof o.weatherCode !== "number") return null;

  const weatherKind =
    o.weatherKind === "current" || o.weatherKind === "historical"
      ? o.weatherKind
      : "historical";

  if (weatherKind === "current") {
    if (typeof o.tempC !== "number") return null;
    return {
      ...(raw as OpenMeteoPinPayload),
      weatherKind,
      tempC: o.tempC,
    };
  }

  if (typeof o.maxTempC !== "number") return null;
  return {
    ...(raw as OpenMeteoPinPayload),
    weatherKind,
    maxTempC: o.maxTempC,
  };
}

const COORD_EPSILON = 0.0001;

export function openMeteoPayloadMatches(
  payload: OpenMeteoPinPayload,
  request: OpenMeteoWeatherRequest,
  lat: number,
  lng: number,
): boolean {
  if (payload.weatherKind !== request.kind) return false;
  if (
    payload.periodStart !== request.period.start ||
    payload.periodEnd !== request.period.end
  ) {
    return false;
  }
  if (
    Math.abs(payload.lat - lat) >= COORD_EPSILON ||
    Math.abs(payload.lng - lng) >= COORD_EPSILON
  ) {
    return false;
  }

  if (request.kind === "current") {
    const today = localTodayYmd();
    if (payload.periodStart !== today || payload.periodEnd !== today) {
      return false;
    }
    if (typeof payload.fetchedAt !== "string") return false;
    const age = Date.now() - new Date(payload.fetchedAt).getTime();
    return age >= 0 && age <= OPEN_METEO_CURRENT_WEATHER_MAX_AGE_MS;
  }

  return true;
}
