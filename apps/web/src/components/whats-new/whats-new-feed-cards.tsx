import { UserAvatar } from "@/components/user-avatar";
import { formatPinCount, formatTimeAgo } from "@/lib/format-time-ago";
import { homeFeedMapHref, type HomeFeedMap } from "@/lib/home-feed";
import { defaultMapIcon } from "@/lib/map-display-icon";
import {
  MapCard,
  MapCardCompact,
  MapCardEmptyState,
  MapCardMasonryGrid,
  MapCardStreamItem,
  MapCardStreamPanel,
} from "@curolia/ui/map-card";

function ownerDisplayName(map: HomeFeedMap): string {
  const name = map.owner_display_name?.trim();
  if (name) return name;
  return `@${map.owner_profile_slug}`;
}

export function WhatsNewMapCard({
  map,
  showOwner = false,
}: {
  map: HomeFeedMap;
  showOwner?: boolean;
}) {
  const authorName = showOwner ? ownerDisplayName(map) : undefined;

  return (
    <MapCard
      to={homeFeedMapHref(map)}
      title={map.name}
      description={map.description?.trim() || undefined}
      authorAvatar={
        showOwner ? (
          <UserAvatar
            storedAvatarUrl={map.owner_avatar_url}
            email={null}
            gravatarHash={map.owner_gravatar_hash}
            gravatarFallback
            gravatarSize={40}
            size="xs"
            label={authorName ?? ""}
          />
        ) : undefined
      }
      authorName={authorName}
      coverUrl={map.cover_url}
      iconEmoji={map.icon_emoji ?? defaultMapIcon()}
      layoutSeed={map.id}
      pinCountLabel={formatPinCount(map.pin_count)}
      updatedLabel={`Updated ${formatTimeAgo(map.updated_at)}`}
    />
  );
}

export function WhatsNewCompactMap({ map }: { map: HomeFeedMap }) {
  return (
    <MapCardCompact
      to={homeFeedMapHref(map)}
      title={map.name}
      coverUrl={map.cover_url}
      iconEmoji={map.icon_emoji ?? defaultMapIcon()}
      subtitle={formatPinCount(map.pin_count)}
    />
  );
}

export function WhatsNewStreamSection({
  title,
  maps,
  emptyLabel,
}: {
  title: string;
  maps: HomeFeedMap[];
  emptyLabel: string;
}) {
  return (
    <MapCardStreamPanel
      title={title}
      empty={
        maps.length === 0 ? (
          <MapCardEmptyState>{emptyLabel}</MapCardEmptyState>
        ) : undefined
      }
    >
      {maps.map((map) => (
        <MapCardStreamItem key={map.id}>
          <WhatsNewCompactMap map={map} />
        </MapCardStreamItem>
      ))}
    </MapCardStreamPanel>
  );
}

export function WhatsNewFeedGrid({ maps }: { maps: HomeFeedMap[] }) {
  if (maps.length === 0) {
    return (
      <MapCardEmptyState>
        Follow public profiles or explore public maps to fill this feed.
      </MapCardEmptyState>
    );
  }

  return (
    <MapCardMasonryGrid columns={4}>
      {maps.map((map) => (
        <WhatsNewMapCard key={map.id} map={map} showOwner />
      ))}
    </MapCardMasonryGrid>
  );
}
