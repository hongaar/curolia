import { ProfileFollowButton } from "@/components/profile/profile-follow-button";
import { ProfileFollowStatPopover } from "@/components/profile/profile-follow-stat-popover";
import { ProfileVisibilityMenu } from "@/components/profile/profile-visibility-controls";
import { UserAvatar } from "@/components/user-avatar";
import { usePublicProfileCrawlerBlockMeta } from "@/hooks/use-public-profile-crawler-block-meta";
import { publicMapLinkHref } from "@/lib/app-paths";
import { fetchProfileFollowStats } from "@/lib/fetch-profile-follow-stats";
import { fetchProfileMaps } from "@/lib/fetch-profile-maps";
import { formatPinCount, formatTimeAgo } from "@/lib/format-time-ago";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { mapRouteForMap } from "@/lib/map-route";
import { resolveMapVisibility } from "@/lib/map-visibility";
import { profileEditHref, publicProfileHref } from "@/lib/profile-route";
import { resolveProfileBySlug } from "@/lib/resolve-profile-slug";
import { supabase } from "@/lib/supabase";
import { useProfileFollow } from "@/lib/use-profile-follow";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  MapCard,
  MapCardEmptyState,
  MapCardMasonryGrid,
} from "@curolia/ui/map-card";
import {
  AppPageLayout,
  PageCenteredLoading,
  PageFitButton,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  PageInlineActions,
  PageMuted,
  PagePanel,
} from "@curolia/ui/page";
import {
  ProfileOverviewAside,
  ProfileOverviewIdentity,
  ProfileOverviewLayout,
  ProfileOverviewMain,
  ProfileOverviewStats,
} from "@curolia/ui/profile-overview";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

export function PublicProfilePage() {
  const { profileSlug: profileSlugParam } = useParams<{
    profileSlug: string;
  }>();
  const { user } = useAuth();
  const [profileOverride, setProfileOverride] = useState<Profile | null>(null);

  const profileSlug = profileSlugParam?.trim() ?? "";

  const profileQuery = useQuery({
    queryKey: ["public_profile", profileSlug, user?.id],
    queryFn: async () => {
      const resolved = await resolveProfileBySlug(profileSlug);
      if (!resolved) return { kind: "missing" as const };

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", resolved.profileId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { kind: "missing" as const };

      const profile = data as Profile;
      const isOwner = user?.id === profile.id;
      const canView = profile.is_public || isOwner;

      if (!canView) {
        return {
          kind: "private" as const,
          canonicalSlug: resolved.canonicalSlug,
          redirected: resolved.redirected,
        };
      }

      const maps = await fetchProfileMaps(
        profile.id,
        resolved.canonicalSlug,
        user?.id ?? null,
      );

      const followStats = await fetchProfileFollowStats(
        profile.id,
        user?.id ?? null,
        supabase,
      );

      return {
        kind: "ok" as const,
        profile,
        maps,
        isOwner,
        followStats,
        canonicalSlug: resolved.canonicalSlug,
        redirected: resolved.redirected,
      };
    },
    enabled: Boolean(profileSlug),
  });

  const result = profileQuery.data;
  const queryProfile = result?.kind === "ok" ? result.profile : null;
  const [prevQueryProfile, setPrevQueryProfile] = useState(queryProfile);
  if (queryProfile !== prevQueryProfile) {
    setPrevQueryProfile(queryProfile);
    setProfileOverride(null);
  }
  const profile = queryProfile ? (profileOverride ?? queryProfile) : null;
  const okResult = result?.kind === "ok" ? result : null;

  const follow = useProfileFollow({
    profileId: okResult?.profile.id ?? "",
    profileSlug: okResult?.profile.slug ?? profileSlug,
    viewerUserId: user?.id,
    isOwner: okResult?.isOwner ?? false,
    isFollowing: okResult?.followStats.isFollowing ?? false,
    enabled: Boolean(okResult?.profile.is_public && okResult.profile.id),
  });

  usePublicProfileCrawlerBlockMeta(
    profile,
    Boolean(profile?.is_public && !user),
  );

  if (!profileSlug) {
    return <PageCenteredLoading>Missing profile.</PageCenteredLoading>;
  }

  if (profileQuery.isPending) {
    return <PageCenteredLoading>Loading profile…</PageCenteredLoading>;
  }

  if (profileQuery.isError) {
    return (
      <AppPageLayout width="narrow">
        <PagePanel>
          <PageMuted>Could not load this profile.</PageMuted>
        </PagePanel>
      </AppPageLayout>
    );
  }

  if (result?.kind === "missing") {
    return (
      <AppPageLayout width="narrow">
        <PagePanel>
          <PageHeader>
            <PageHeaderTitle>Profile not found</PageHeaderTitle>
            <PageHeaderLead>
              This profile does not exist or the URL may be incorrect.
            </PageHeaderLead>
          </PageHeader>
        </PagePanel>
      </AppPageLayout>
    );
  }

  if (result?.kind === "private") {
    if (result.redirected && result.canonicalSlug !== profileSlug) {
      return <Navigate to={publicProfileHref(result.canonicalSlug)} replace />;
    }
    return (
      <AppPageLayout width="narrow">
        <PagePanel>
          <PageHeader>
            <PageHeaderTitle>Private profile</PageHeaderTitle>
            <PageHeaderLead>
              This profile is not public. Sign in as the owner to view it.
            </PageHeaderLead>
          </PageHeader>
        </PagePanel>
      </AppPageLayout>
    );
  }

  if (!profile || !okResult) {
    return null;
  }

  if (okResult.redirected && okResult.canonicalSlug !== profileSlug) {
    return <Navigate to={publicProfileHref(okResult.canonicalSlug)} replace />;
  }

  const displayName =
    profile.display_name?.trim() || profile.slug || "Traveler";
  const maps = okResult.maps;
  const isOwner = okResult.isOwner;
  const followStats = okResult.followStats;

  return (
    <AppPageLayout width="full">
      <ProfileOverviewLayout>
        <ProfileOverviewAside>
          <PagePanel mobileCard>
            <ProfileOverviewIdentity
              avatar={
                <UserAvatar
                  storedAvatarUrl={profile.avatar_url}
                  email={isOwner ? user?.email : null}
                  gravatarFallback={isOwner}
                  gravatarSize={256}
                  size="lg"
                  label={displayName}
                />
              }
              name={displayName}
              bio={profile.bio?.trim() || undefined}
            />
            {profile.is_public || isOwner ? (
              <ProfileOverviewStats>
                <ProfileFollowStatPopover
                  profileId={profile.id}
                  kind="followers"
                  label="Followers"
                  value={followStats.followerCount.toLocaleString()}
                />
                <ProfileFollowStatPopover
                  profileId={profile.id}
                  kind="following"
                  label="Following"
                  value={followStats.followingCount.toLocaleString()}
                />
              </ProfileOverviewStats>
            ) : null}
            {isOwner ? (
              <PageFitButton>
                <PageInlineActions spaced="none">
                  <Button
                    variant="outline"
                    render={<Link to={profileEditHref()} />}
                  >
                    Edit profile
                  </Button>
                  <ProfileVisibilityMenu
                    profile={profile}
                    onProfileChange={setProfileOverride}
                  />
                </PageInlineActions>
              </PageFitButton>
            ) : profile.is_public ? (
              <PageFitButton>
                <ProfileFollowButton
                  isFollowing={follow.isFollowing}
                  busy={follow.busy}
                  canFollow={follow.canFollow}
                  onToggle={() => void follow.toggleFollow()}
                />
              </PageFitButton>
            ) : null}
          </PagePanel>
        </ProfileOverviewAside>

        <ProfileOverviewMain>
          {maps.length === 0 ? (
            <MapCardEmptyState>
              {isOwner
                ? "Your public maps and shared maps will appear here."
                : "No maps to show yet."}
            </MapCardEmptyState>
          ) : (
            <MapCardMasonryGrid>
              {maps.map((map) => (
                <MapCard
                  key={map.id}
                  to={publicMapLinkHref(mapRouteForMap(map))}
                  title={map.name}
                  description={map.description?.trim() || undefined}
                  coverUrl={map.cover_url}
                  iconEmoji={map.icon_emoji ?? defaultMapIcon()}
                  layoutSeed={map.id}
                  pinCountLabel={formatPinCount(map.pin_count)}
                  updatedLabel={`Updated ${formatTimeAgo(map.updated_at)}`}
                  visibility={
                    isOwner
                      ? resolveMapVisibility(map, map.member_count)
                      : undefined
                  }
                />
              ))}
            </MapCardMasonryGrid>
          )}
        </ProfileOverviewMain>
      </ProfileOverviewLayout>
    </AppPageLayout>
  );
}
