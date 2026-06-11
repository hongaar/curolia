import type { DirectionsProvider } from "./config";

export function buildDirectionsUrl(
  provider: DirectionsProvider,
  lat: number,
  lng: number,
): string {
  const coord = `${lat},${lng}`;
  switch (provider) {
    case "google_maps":
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(coord)}`;
    case "apple_maps":
      return `https://maps.apple.com/?daddr=${encodeURIComponent(coord)}&dirflg=d`;
    case "waze":
      return `https://www.waze.com/ul?ll=${coord}&navigate=yes`;
    case "citymapper":
      return `https://citymapper.com/directions?endcoord=${coord}`;
    case "here_wego":
      return `https://wego.here.com/directions/mix//:${coord}`;
  }
}

export function openDirectionsUrl(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}
