export const DIRECTIONS_PLUGIN_ID = "directions" as const;

export const DIRECTIONS_PROVIDERS = [
  "google_maps",
  "apple_maps",
  "waze",
  "citymapper",
  "here_wego",
] as const;

export type DirectionsProvider = (typeof DIRECTIONS_PROVIDERS)[number];

export const DEFAULT_DIRECTIONS_PROVIDER: DirectionsProvider = "google_maps";

export const DIRECTIONS_PROVIDER_LABELS: Record<DirectionsProvider, string> = {
  google_maps: "Google Maps",
  apple_maps: "Apple Maps",
  waze: "Waze",
  citymapper: "Citymapper",
  here_wego: "HERE WeGo",
};

export type DirectionsUserConfig = {
  provider: DirectionsProvider;
};

function isDirectionsProvider(value: unknown): value is DirectionsProvider {
  return (
    typeof value === "string" &&
    (DIRECTIONS_PROVIDERS as readonly string[]).includes(value)
  );
}

export function parseDirectionsUserConfig(raw: unknown): DirectionsUserConfig {
  if (!raw || typeof raw !== "object") {
    return { provider: DEFAULT_DIRECTIONS_PROVIDER };
  }
  const directions = (raw as { directions?: unknown }).directions;
  if (!directions || typeof directions !== "object") {
    return { provider: DEFAULT_DIRECTIONS_PROVIDER };
  }
  const provider = (directions as { provider?: unknown }).provider;
  return {
    provider: isDirectionsProvider(provider)
      ? provider
      : DEFAULT_DIRECTIONS_PROVIDER,
  };
}
