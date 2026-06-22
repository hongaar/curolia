import { HomeSidebar } from "@/components/home/home-sidebar";
import {
  WhatsNewFeedGrid,
  WhatsNewStreamSection,
} from "@/components/whats-new/whats-new-feed-cards";
import { featureFlags } from "@/lib/feature-flags";
import {
  fetchDiscoverRecentPublicMaps,
  fetchFollowedRecentPublicMaps,
  fetchRecentlyEditedMaps,
  fetchRecentlyVisitedMaps,
  mixHomeFeedMaps,
} from "@/lib/home-feed";
import { useAuth } from "@/providers/auth-provider";
import {
  HomeFeedAside,
  HomeFeedLayout,
  HomeFeedMain,
} from "@curolia/ui/home-feed";
import { MapCardEmptyState } from "@curolia/ui/map-card";
import {
  AppPageLayout,
  PageCenteredLoading,
  PageHeader,
  PageHeaderTitle,
} from "@curolia/ui/page";
import { Stack } from "@curolia/ui/stack";
import { useQuery } from "@tanstack/react-query";

export function WhatsNewPage() {
  const { user } = useAuth();

  const feedQuery = useQuery({
    queryKey: ["home_feed", user?.id],
    queryFn: async () => {
      const [visited, edited, followed, discover] = await Promise.all([
        featureFlags.homeRecentlyVisited
          ? fetchRecentlyVisitedMaps()
          : Promise.resolve([]),
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
    return <PageCenteredLoading>Loading what&apos;s new</PageCenteredLoading>;
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
          <HomeSidebar editedMaps={edited} />
        </HomeFeedAside>

        <HomeFeedMain>
          <Stack gap="2xl">
            <Stack gap="md">
              <PageHeader>
                <PageHeaderTitle>What&apos;s new</PageHeaderTitle>
              </PageHeader>
              <WhatsNewFeedGrid maps={feed} />
            </Stack>

            {featureFlags.homeRecentlyVisited ? (
              <WhatsNewStreamSection
                title="Recently visited"
                maps={visited}
                emptyLabel="Maps you open will show up here."
              />
            ) : null}
          </Stack>
        </HomeFeedMain>
      </HomeFeedLayout>
    </AppPageLayout>
  );
}
