import type { PeriodWeatherSummary } from "./open-meteo-weather";

/** Shape stored in `plugin_entity_data.data` for `plugin_type_id = open-meteo`. */
export type OpenMeteoPinPayload = {
  schemaVersion: 1;
  periodStart: string;
  periodEnd: string;
  lat: number;
  lng: number;
  fetchedAt: string;
  weatherCode: number;
  /** Highest daily maximum temperature (°C) across the pin period. */
  maxTempC: number;
};

export function openMeteoPayloadFromSummary(
  summary: PeriodWeatherSummary,
  period: { start: string; end: string },
  lat: number,
  lng: number,
): OpenMeteoPinPayload {
  return {
    schemaVersion: 1,
    periodStart: period.start,
    periodEnd: period.end,
    lat,
    lng,
    fetchedAt: new Date().toISOString(),
    weatherCode: summary.dominantWeatherCode,
    maxTempC: summary.maxTempC,
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
  if (typeof o.weatherCode !== "number" || typeof o.maxTempC !== "number") {
    return null;
  }
  return raw as OpenMeteoPinPayload;
}

const COORD_EPSILON = 0.0001;

export function openMeteoPayloadMatches(
  payload: OpenMeteoPinPayload,
  period: { start: string; end: string },
  lat: number,
  lng: number,
): boolean {
  return (
    payload.periodStart === period.start &&
    payload.periodEnd === period.end &&
    Math.abs(payload.lat - lat) < COORD_EPSILON &&
    Math.abs(payload.lng - lng) < COORD_EPSILON
  );
}
