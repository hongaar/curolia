import { formatPinCount, formatTimeAgo } from "@/lib/format-time-ago";
import { homeFeedMapHref, type HomeFeedMap } from "@/lib/home-feed";
import { defaultMapIcon } from "@/lib/map-display-icon";
import {
  HomeFeedMapList,
  HomeFeedMapListEmpty,
  HomeFeedMapListItem,
  type HomeFeedMapListPlacement,
} from "@curolia/ui/home-feed";

export function HomeEditedMapsList({
  maps,
  placement = "sidebar",
}: {
  maps: HomeFeedMap[];
  placement?: HomeFeedMapListPlacement;
}) {
  return (
    <HomeFeedMapList
      title="Your maps"
      placement={placement}
      empty={
        <HomeFeedMapListEmpty>
          Maps you can edit will appear here after changes.
        </HomeFeedMapListEmpty>
      }
    >
      {maps.map((map) => (
        <HomeFeedMapListItem
          key={map.id}
          to={homeFeedMapHref(map)}
          title={map.name}
          coverUrl={map.cover_url}
          iconEmoji={map.icon_emoji ?? defaultMapIcon()}
          meta={`${formatPinCount(map.pin_count)} · ${formatTimeAgo(map.updated_at)}`}
        />
      ))}
    </HomeFeedMapList>
  );
}
