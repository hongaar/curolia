import { UserAvatar } from "@/components/user-avatar";
import type { PublicMapOwnerProfile } from "@/hooks/use-public-map-owner-profile";
import { BlogAuthorCard } from "@curolia/ui/blog";

export function PublicMapOwnerCard({
  profile,
  surface = "default",
  showBio = true,
}: {
  profile: PublicMapOwnerProfile;
  surface?: "default" | "floating";
  /** When false, only avatar and name are shown (e.g. compact map overlay). */
  showBio?: boolean;
}) {
  return (
    <BlogAuthorCard
      surface={surface}
      avatar={
        <UserAvatar
          storedAvatarUrl={profile.avatarUrl}
          email={null}
          gravatarFallback={false}
          size="md"
          label={profile.displayName}
        />
      }
      name={profile.displayName}
      bio={showBio ? (profile.bio ?? undefined) : undefined}
    />
  );
}
