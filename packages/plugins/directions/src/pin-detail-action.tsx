import type { PinDetailActionProps } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import { Navigation2 } from "lucide-react";
import { DIRECTIONS_PROVIDER_LABELS } from "./config";
import { buildDirectionsUrl, openDirectionsUrl } from "./navigation-url";
import { useDirectionsProvider } from "./use-directions-provider";

function validCoords(
  lat: unknown,
  lng: unknown,
): lat is number & { toString: () => string } {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

export function DirectionsPinDetailAction({
  supabase,
  userId,
  pinLat,
  pinLng,
  pinTitle,
  surface,
}: PinDetailActionProps) {
  const { provider } = useDirectionsProvider({ supabase, userId });

  if (!validCoords(pinLat, pinLng)) return null;

  const url = buildDirectionsUrl(provider, pinLat, pinLng);
  const providerLabel = DIRECTIONS_PROVIDER_LABELS[provider];
  const destination = pinTitle?.trim() || "this pin";
  const ariaLabel = `Get directions to ${destination} in ${providerLabel}`;

  if (surface === "popover") {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        aria-label={ariaLabel}
        onClick={() => openDirectionsUrl(url)}
      >
        <Navigation2 aria-hidden />
        Directions
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={ariaLabel}
      onClick={() => openDirectionsUrl(url)}
    >
      <Navigation2 aria-hidden />
      Directions
    </Button>
  );
}
