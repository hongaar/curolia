import { UserAvatar } from "@/components/user-avatar";
import type { PublicMapOwnerProfile } from "@/hooks/use-public-map-owner-profile";
import { publicProfileHref } from "@/lib/profile-route";
import { BlogAuthorCard } from "@curolia/ui/blog";

export function PublicMapOwnerCard({
  profile,
  surface = "default",
  showBio = true,
  hidden,
}: {
  profile: PublicMapOwnerProfile;
  surface?: "default" | "floating";
  /** When false, only avatar and name are shown (e.g. compact map overlay). */
  showBio?: boolean;
  /** Floating only: slide the card out to the left. */
  hidden?: boolean;
}) {
  return (
    <BlogAuthorCard
      surface={surface}
      hidden={hidden}
      avatar={
        <UserAvatar
          storedAvatarUrl={profile.avatarUrl}
          email={null}
          gravatarHash={profile.gravatarHash}
          gravatarFallback={Boolean(profile.gravatarHash)}
          size="md"
          label={profile.displayName}
        />
      }
      name={profile.displayName}
      nameHref={publicProfileHref(profile.profileSlug)}
      bio={showBio ? (profile.bio ?? undefined) : undefined}
    />
  );
}
