export function openMeteoWeatherQueryKey(
  pinId: string,
  kind: "current" | "historical",
  startDate: string,
  endDate: string,
  lat: number,
  lng: number,
): readonly [
  "open-meteo",
  "pin",
  string,
  "current" | "historical",
  string,
  string,
  number,
  number,
] {
  return ["open-meteo", "pin", pinId, kind, startDate, endDate, lat, lng];
}

export function openMeteoEntityDataQueryKey(
  pluginTypeId: string,
  pinId: string,
): readonly ["plugin_entity_data", string, "pin", string] {
  return ["plugin_entity_data", pluginTypeId, "pin", pinId];
}
