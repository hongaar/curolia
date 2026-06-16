import { HomeSidebar } from "@/components/home/home-sidebar";
import { UserAvatar } from "@/components/user-avatar";
import { formatPinCount, formatTimeAgo } from "@/lib/format-time-ago";
import {
  fetchDiscoverRecentPublicMaps,
  fetchFollowedRecentPublicMaps,
  fetchRecentlyEditedMaps,
  fetchRecentlyVisitedMaps,
  homeFeedMapHref,
  mixHomeFeedMaps,
  type HomeFeedMap,
} from "@/lib/home-feed";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { useAuth } from "@/providers/auth-provider";
import {
  HomeFeedAside,
  HomeFeedLayout,
  HomeFeedMain,
} from "@curolia/ui/home-feed";
import {
  MapCard,
  MapCardCompact,
  MapCardEmptyState,
  MapCardMasonryGrid,
  MapCardStreamItem,
  MapCardStreamPanel,
} from "@curolia/ui/map-card";
import {
  AppPageLayout,
  PageCenteredLoading,
  PageHeader,
  PageHeaderTitle,
} from "@curolia/ui/page";
import { Stack } from "@curolia/ui/stack";
import { useQuery } from "@tanstack/react-query";

function ownerDisplayName(map: HomeFeedMap): string {
  const name = map.owner_display_name?.trim();
  if (name) return name;
  return `@${map.owner_profile_slug}`;
}

function HomeFeedMapCard({
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

function HomeFeedCompactMap({ map }: { map: HomeFeedMap }) {
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

function HomeFeedStreamSection({
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
          <HomeFeedCompactMap map={map} />
        </MapCardStreamItem>
      ))}
    </MapCardStreamPanel>
  );
}

export function HomeFeedPage() {
  const { user } = useAuth();

  const feedQuery = useQuery({
    queryKey: ["home_feed", user?.id],
    queryFn: async () => {
      const [visited, edited, followed, discover] = await Promise.all([
        fetchRecentlyVisitedMaps(),
        fetchRecentlyEditedMaps(),
        fetchFollowedRecentPublicMaps(),
        fetchDiscoverRecentPublicMaps(),
      ]);

      return {
        visited,
        edited,
        feed: mixHomeFeedMaps(followed, discover),
      };
    },
    enabled: Boolean(user),
  });

  if (feedQuery.isLoading) {
    return <PageCenteredLoading>Loading your feed</PageCenteredLoading>;
  }

  if (feedQuery.isError) {
    return (
      <AppPageLayout width="full">
        <MapCardEmptyState>
          Could not load your feed. Try refreshing the page.
        </MapCardEmptyState>
      </AppPageLayout>
    );
  }

  const { visited, edited, feed } = feedQuery.data ?? {
    visited: [],
    edited: [],
    feed: [],
  };

  return (
    <AppPageLayout width="full">
      <HomeFeedLayout>
        <HomeFeedAside>
          <HomeSidebar />
        </HomeFeedAside>

        <HomeFeedMain>
          <Stack gap="2xl">
            <HomeFeedStreamSection
              title="Recently edited"
              maps={edited}
              emptyLabel="Maps you can edit will appear here after changes."
            />

            <Stack gap="md">
              <PageHeader>
                <PageHeaderTitle>Recent updates</PageHeaderTitle>
              </PageHeader>
              {feed.length === 0 ? (
                <MapCardEmptyState>
                  Follow public profiles or explore public maps to fill this
                  feed.
                </MapCardEmptyState>
              ) : (
                <MapCardMasonryGrid columns={4}>
                  {feed.map((map) => (
                    <HomeFeedMapCard key={map.id} map={map} showOwner />
                  ))}
                </MapCardMasonryGrid>
              )}
            </Stack>

            <HomeFeedStreamSection
              title="Recently visited"
              maps={visited}
              emptyLabel="Maps you open will show up here."
            />
          </Stack>
        </HomeFeedMain>
      </HomeFeedLayout>
    </AppPageLayout>
  );
}
