/** Map POI provider error codes to user-facing copy. */
export function formatPoiErrorMessage(code: string): string {
  if (!code.trim()) return "";
  if (
    code.startsWith("geoapify_http_429") ||
    code.startsWith("overpass_http_429") ||
    code.startsWith("nominatim_http_429")
  ) {
    return "The places service is busy. Wait a moment and try again.";
  }
  if (
    code.startsWith("geoapify_http_") ||
    code.startsWith("overpass_http_") ||
    code.startsWith("nominatim_http_")
  ) {
    return "Could not reach the places service. Try again.";
  }
  if (/connection refused|tcp connect error/i.test(code)) {
    return "Could not reach the places service from the server. Try again.";
  }
  if (
    code === "overpass_failed" ||
    code === "overpass_fetch_failed" ||
    code === "overpass_invalid_json" ||
    code === "geoapify_failed" ||
    code === "geoapify_invalid_json" ||
    code === "nominatim_failed" ||
    code === "nominatim_invalid_json"
  ) {
    return "Could not load nearby places. Try again.";
  }
  if (code === "poi_request_failed") {
    return "Could not reach the places service. Try again.";
  }
  if (/timeout|timed out/i.test(code)) {
    return "Place search timed out. Try again.";
  }
  return code;
}
