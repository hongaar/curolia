import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

/** On native shells, ensure OS location permission before WebView geolocation. */
export async function ensureNativeLocationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;

  const status = await Geolocation.checkPermissions();
  if (status.location === "granted") return true;

  const requested = await Geolocation.requestPermissions();
  return requested.location === "granted";
}
