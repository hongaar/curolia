import { useProfileVisibility } from "@/lib/use-profile-visibility";
import type { Profile } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@curolia/ui/dropdown-menu";
import { Label } from "@curolia/ui/label";
import {
  PageSectionSubheading,
  PageSwitchRow,
  PageSwitchStack,
} from "@curolia/ui/page";
import { Switch } from "@curolia/ui/switch";
import { ChevronDown, Globe, Lock } from "lucide-react";
import { PrivateProfilePublicMapWarning } from "./private-profile-public-map-warning";

export function ProfileVisibilityMenu({
  profile,
  onProfileChange,
}: {
  profile: Profile;
  onProfileChange?: (next: Profile) => void;
}) {
  const { setPublic, publicBusy } = useProfileVisibility(profile);
  const value = profile.is_public ? "public" : "private";
  const VisibilityIcon = profile.is_public ? Globe : Lock;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            disabled={publicBusy}
            aria-label="Profile visibility"
          />
        }
      >
        <VisibilityIcon aria-hidden size={16} />
        {profile.is_public ? "Public" : "Private"}
        <ChevronDown aria-hidden size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => {
              if (next !== "public" && next !== "private") return;
              void setPublic(next === "public").then((updated) => {
                if (updated) onProfileChange?.(updated);
              });
            }}
          >
            <DropdownMenuRadioItem value="public">Public</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="private">
              Private
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProfileVisibilitySettings({
  profile,
  disabled = false,
}: {
  profile: Profile;
  disabled?: boolean;
}) {
  const { setPublic, setBlockCrawlers, publicBusy, crawlerBlockBusy } =
    useProfileVisibility(profile);

  return (
    <>
      <PageSectionSubheading>Visibility</PageSectionSubheading>
      <PageSwitchStack>
        <PageSwitchRow
          label={<Label htmlFor="profile-public-toggle">Public profile</Label>}
          hint="Anyone with the link can view your profile page and public maps."
          control={
            <Switch
              id="profile-public-toggle"
              checked={profile.is_public}
              disabled={disabled || publicBusy}
              onCheckedChange={(checked) => void setPublic(checked)}
            />
          }
        />
        {profile.is_public ? (
          <PageSwitchRow
            label={
              <Label htmlFor="profile-block-crawlers-toggle">
                Block search engines and crawlers
              </Label>
            }
            hint="People can still open your profile in a browser, but bots are discouraged from indexing it."
            control={
              <Switch
                id="profile-block-crawlers-toggle"
                checked={profile.block_public_crawlers}
                disabled={disabled || crawlerBlockBusy}
                onCheckedChange={(checked) => void setBlockCrawlers(checked)}
              />
            }
          />
        ) : null}
      </PageSwitchStack>
      {!profile.is_public ? (
        <PrivateProfilePublicMapWarning context="profile-visibility" />
      ) : null}
    </>
  );
}
