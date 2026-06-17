import { mapViewHref } from "@/lib/app-paths";
import type { DiscoverPinMeta } from "@/lib/fetch-discover-pins";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { mapRouteFromParts } from "@/lib/map-route";
import { MapNavButton } from "@curolia/ui/map-picker";
import { useNavigate } from "react-router-dom";

export function PinSourceMapLink({
  sourceMap,
}: {
  sourceMap: DiscoverPinMeta;
}) {
  const navigate = useNavigate();
  const route = mapRouteFromParts(
    sourceMap.ownerProfileSlug,
    sourceMap.mapSlug,
  );

  return (
    <MapNavButton
      mapEmoji={sourceMap.mapEmoji ?? defaultMapIcon()}
      mapName={sourceMap.mapName}
      onClick={() => navigate(mapViewHref("map", route))}
      aria-label={`Open map ${sourceMap.mapName}`}
    />
  );
}
