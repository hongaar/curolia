import { ProfileFollowButton } from "@/components/profile/profile-follow-button";
import { ProfileFollowStatPopover } from "@/components/profile/profile-follow-stat-popover";
import { ProfileVisibilityMenu } from "@/components/profile/profile-visibility-controls";
import { UserAvatar } from "@/components/user-avatar";
import { usePublicProfileCrawlerBlockMeta } from "@/hooks/use-public-profile-crawler-block-meta";
import { publicMapLinkHref } from "@/lib/app-paths";
import {
  fetchProfileFollowStats,
  type FollowStatus,
} from "@/lib/fetch-profile-follow-stats";
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
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import type { Profile } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  MapCard,
  MapCardCreateAction,
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
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";

type RestrictedProfileCard = {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  gravatarHash: string | null;
  followStatus: FollowStatus | null;
};

async function loadRestrictedCard(
  slug: string,
  signedIn: boolean,
): Promise<
  | { kind: "restricted"; card: RestrictedProfileCard }
  | { kind: "restricted_signed_out" }
  | null
> {
  if (!signedIn) return { kind: "restricted_signed_out" };
  const { data, error } = await supabase.rpc("get_restricted_profile_card", {
    p_slug: slug,
  });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    kind: "restricted",
    card: {
      id: row.id,
      slug: row.slug,
      displayName: row.display_name?.trim() || row.slug,
      avatarUrl: row.avatar_url,
      gravatarHash: row.gravatar_hash,
      followStatus: row.follow_status ?? null,
    },
  };
}

const RESTRICTED = { visibility: "restricted" } as const;

export function PublicProfilePage() {
  const { profileSlug: profileSlugParam } = useParams<{
    profileSlug: string;
  }>();
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const openFollowRequests = searchParams.get("followers") === "requests";
  const { openNewMapDialog } = useNavigationShell();
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
      if (!data) {
        // Row hidden by RLS: restricted (not an approved follower) or private.
        if (resolved.visibility === "restricted") {
          const restricted = await loadRestrictedCard(
            resolved.canonicalSlug,
            Boolean(user),
          );
          if (restricted) return restricted;
        }
        if (resolved.visibility === "public")
          return { kind: "missing" as const };
        return {
          kind: "private" as const,
          canonicalSlug: resolved.canonicalSlug,
          redirected: resolved.redirected,
        };
      }

      const profile = data as Profile;
      const isOwner = user?.id === profile.id;
      const canView = profile.visibility !== "private" || isOwner;

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
  const restrictedCard = result?.kind === "restricted" ? result.card : null;
  const followTarget = okResult
    ? {
        id: okResult.profile.id,
        slug: okResult.profile.slug,
        status: okResult.followStats.followStatus,
        enabled: okResult.profile.visibility !== "private",
      }
    : restrictedCard
      ? {
          id: restrictedCard.id,
          slug: restrictedCard.slug,
          status: restrictedCard.followStatus,
          enabled: true,
        }
      : null;

  const follow = useProfileFollow({
    profileId: followTarget?.id ?? "",
    profileSlug: followTarget?.slug ?? profileSlug,
    viewerUserId: user?.id,
    isOwner: okResult?.isOwner ?? false,
    followStatus: followTarget?.status ?? null,
    enabled: Boolean(followTarget?.enabled && followTarget.id),
  });

  usePublicProfileCrawlerBlockMeta(
    profile ?? (result?.kind?.startsWith("restricted") ? RESTRICTED : null),
    Boolean(
      (profile && profile.visibility !== "private") ||
      result?.kind?.startsWith("restricted"),
    ),
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

  if (result?.kind === "restricted_signed_out") {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return (
      <AppPageLayout width="narrow">
        <PagePanel>
          <PageHeader>
            <PageHeaderTitle>Restricted profile</PageHeaderTitle>
            <PageHeaderLead>
              Sign in to see who this is and request to follow them.
            </PageHeaderLead>
          </PageHeader>
          <PageFitButton>
            <Button render={<Link to={`/login?next=${next}`} />}>
              Sign in
            </Button>
          </PageFitButton>
        </PagePanel>
      </AppPageLayout>
    );
  }

  if (restrictedCard) {
    return (
      <AppPageLayout width="full">
        <ProfileOverviewLayout>
          <ProfileOverviewAside>
            <PagePanel mobileCard>
              <ProfileOverviewIdentity
                avatar={
                  <UserAvatar
                    storedAvatarUrl={restrictedCard.avatarUrl}
                    email={null}
                    gravatarHash={restrictedCard.gravatarHash}
                    gravatarFallback={Boolean(
                      restrictedCard.gravatarHash?.trim(),
                    )}
                    gravatarSize={256}
                    size="lg"
                    label={restrictedCard.displayName}
                  />
                }
                name={restrictedCard.displayName}
              />
              <PageFitButton>
                <ProfileFollowButton
                  followStatus={follow.followStatus}
                  requiresApproval
                  busy={follow.busy}
                  canFollow={follow.canFollow}
                  onToggle={() => void follow.toggleFollow()}
                />
              </PageFitButton>
            </PagePanel>
          </ProfileOverviewAside>
          <ProfileOverviewMain>
            <MapCardEmptyState>
              {follow.followStatus === "pending"
                ? "Your follow request is pending. Maps are visible once it's approved."
                : "This profile is restricted. Maps are only visible to approved followers."}
            </MapCardEmptyState>
          </ProfileOverviewMain>
        </ProfileOverviewLayout>
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
  // Restricted: map members can read the profile row (co-worker access), but
  // follow lists stay hidden until they are an approved follower.
  const canSeeFollowStats =
    isOwner ||
    profile.visibility === "public" ||
    (profile.visibility === "restricted" &&
      followStats.followStatus === "approved");

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
                  gravatarHash={profile.gravatar_hash}
                  gravatarFallback={
                    isOwner || Boolean(profile.gravatar_hash?.trim())
                  }
                  gravatarSize={256}
                  size="lg"
                  label={displayName}
                />
              }
              name={displayName}
              bio={profile.bio?.trim() || undefined}
            />
            {canSeeFollowStats ? (
              <ProfileOverviewStats>
                <ProfileFollowStatPopover
                  profileId={profile.id}
                  kind="followers"
                  label="Followers"
                  value={followStats.followerCount.toLocaleString()}
                  showRequests={isOwner}
                  canRemoveFollowers={
                    isOwner && profile.visibility === "restricted"
                  }
                  defaultOpen={isOwner && openFollowRequests}
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
            ) : profile.visibility !== "private" ? (
              <PageFitButton>
                <ProfileFollowButton
                  followStatus={follow.followStatus}
                  requiresApproval={profile.visibility === "restricted"}
                  busy={follow.busy}
                  canFollow={follow.canFollow}
                  onToggle={() => void follow.toggleFollow()}
                />
              </PageFitButton>
            ) : null}
          </PagePanel>
        </ProfileOverviewAside>

        <ProfileOverviewMain>
          {maps.length === 0 && !isOwner ? (
            <MapCardEmptyState>No maps to show yet.</MapCardEmptyState>
          ) : (
            <MapCardMasonryGrid>
              {isOwner ? (
                <MapCardCreateAction
                  label="New map"
                  onClick={() => openNewMapDialog()}
                />
              ) : null}
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
          {isOwner && profile.visibility === "restricted" ? (
            <PageMuted>
              Your profile is restricted: these maps are only listed for
              followers you approve.
            </PageMuted>
          ) : null}
        </ProfileOverviewMain>
      </ProfileOverviewLayout>
    </AppPageLayout>
  );
}
