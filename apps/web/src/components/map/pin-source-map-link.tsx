import { mapViewHref } from "@/lib/app-paths";
import type { DiscoverPinMeta } from "@/lib/fetch-discover-pins";
import { formatPinCount, formatTimeAgo } from "@/lib/format-time-ago";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { mapRouteFromParts } from "@/lib/map-route";
import { HomeFeedMapLink } from "@curolia/ui/home-feed";

export function PinSourceMapLink({
  sourceMap,
}: {
  sourceMap: DiscoverPinMeta;
}) {
  const route = mapRouteFromParts(
    sourceMap.ownerProfileSlug,
    sourceMap.mapSlug,
  );

  return (
    <HomeFeedMapLink
      to={mapViewHref("map", route)}
      title={sourceMap.mapName}
      coverUrl={sourceMap.coverUrl}
      iconEmoji={sourceMap.mapEmoji ?? defaultMapIcon()}
      meta={`${formatPinCount(sourceMap.pinCount)} · ${formatTimeAgo(sourceMap.updatedAt)}`}
      inline
    />
  );
}
