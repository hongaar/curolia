import {
  VisibilityChoiceCards,
  VisibilityMenu,
} from "@/components/visibility/visibility-controls";
import { useProfileVisibility } from "@/lib/use-profile-visibility";
import { PROFILE_VISIBILITY_HINTS } from "@/lib/visibility";
import type { Profile } from "@/types/database";
import { PageSectionSubheading } from "@curolia/ui/page";
import { useId } from "react";
import { PrivateProfilePublicMapWarning } from "./private-profile-public-map-warning";

export function ProfileVisibilityMenu({
  profile,
  onProfileChange,
}: {
  profile: Profile;
  onProfileChange?: (next: Profile) => void;
}) {
  const { setVisibility, visibilityBusy } = useProfileVisibility(profile);

  return (
    <VisibilityMenu
      value={profile.visibility}
      disabled={visibilityBusy}
      ariaLabel="Profile visibility"
      onValueChange={(next) => {
        void setVisibility(next).then((updated) => {
          if (updated) onProfileChange?.(updated);
        });
      }}
    />
  );
}

export function ProfileVisibilitySettings({
  profile,
  disabled = false,
}: {
  profile: Profile;
  disabled?: boolean;
}) {
  const { setVisibility, visibilityBusy } = useProfileVisibility(profile);
  const headingId = useId();

  return (
    <>
      <PageSectionSubheading id={headingId}>Visibility</PageSectionSubheading>
      <VisibilityChoiceCards
        name="profile-visibility"
        aria-labelledby={headingId}
        value={profile.visibility}
        hints={PROFILE_VISIBILITY_HINTS}
        disabled={disabled || visibilityBusy}
        onValueChange={(next) => void setVisibility(next)}
      />
      {profile.visibility === "private" ? (
        <PrivateProfilePublicMapWarning context="profile-visibility" />
      ) : null}
    </>
  );
}
