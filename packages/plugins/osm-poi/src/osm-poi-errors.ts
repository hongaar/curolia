/** Map OSM POI / Overpass error codes to user-facing copy. */
export function formatOsmPoiErrorMessage(code: string): string {
  if (!code.trim()) return "";
  if (code.startsWith("overpass_http_429")) {
    return "OpenStreetMap is busy. Wait a moment and try again.";
  }
  if (code.startsWith("overpass_http_504")) {
    return "OpenStreetMap timed out. Try again.";
  }
  if (code.startsWith("overpass_http_503")) {
    return "OpenStreetMap is temporarily unavailable. Try again.";
  }
  if (code.startsWith("overpass_http_")) {
    return "Could not reach OpenStreetMap. Try again.";
  }
  if (/connection refused|tcp connect error/i.test(code)) {
    return "Could not reach OpenStreetMap from the server. Try again.";
  }
  if (
    code === "overpass_failed" ||
    code === "overpass_fetch_failed" ||
    code === "overpass_invalid_json"
  ) {
    return "Could not load places from OpenStreetMap. Try again.";
  }
  if (code === "osm_poi_request_failed") {
    return "Could not reach the OpenStreetMap service. Try again.";
  }
  return code;
}
