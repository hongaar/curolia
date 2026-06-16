import { UserAvatar } from "@/components/user-avatar";
import { useMaxSm } from "@/hooks/use-max-sm";
import { fetchProfileFollowList } from "@/lib/fetch-profile-follow-list";
import { publicProfileHref } from "@/lib/profile-route";
import { supabase } from "@/lib/supabase";
import { BottomSheet } from "@curolia/ui/bottom-sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@curolia/ui/popover";
import {
  ProfileOverviewFollowList,
  ProfileOverviewFollowListItem,
  ProfileOverviewFollowPopoverHeader,
  ProfileOverviewFollowSheetBody,
  ProfileOverviewPopoverScroll,
  ProfileOverviewStatButton,
  profileOverviewStyles,
} from "@curolia/ui/profile-overview";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ProfileFollowListPanel({
  kind,
  title,
  value,
  numericValue,
  users,
  isPending,
  isError,
  onSelectUser,
}: {
  kind: "followers" | "following";
  title: string;
  value: string;
  numericValue: number;
  users: Awaited<ReturnType<typeof fetchProfileFollowList>>;
  isPending: boolean;
  isError: boolean;
  onSelectUser: (slug: string) => void;
}) {
  return (
    <div className={profileOverviewStyles.popoverSurface}>
      <ProfileOverviewFollowPopoverHeader
        title={title}
        count={numericValue > 0 ? value : undefined}
      />
      <ProfileOverviewPopoverScroll>
        {isPending ? (
          <p className={profileOverviewStyles.popoverEmpty}>Loading…</p>
        ) : isError ? (
          <p className={profileOverviewStyles.popoverEmpty}>
            Could not load {title.toLowerCase()}.
          </p>
        ) : users.length === 0 ? (
          <p className={profileOverviewStyles.popoverEmpty}>
            {kind === "followers"
              ? "No followers yet."
              : "Not following anyone yet."}
          </p>
        ) : (
          <ProfileOverviewFollowList>
            {users.map((user) => (
              <ProfileOverviewFollowListItem
                key={user.profileId}
                avatar={
                  <UserAvatar
                    storedAvatarUrl={user.avatarUrl}
                    email={null}
                    gravatarFallback={false}
                    size="sm"
                    label={user.displayName}
                  />
                }
                name={user.displayName}
                handle={
                  user.isPrivate || !user.slug ? undefined : `@${user.slug}`
                }
                onClick={
                  user.isPrivate || !user.slug
                    ? undefined
                    : () => onSelectUser(user.slug!)
                }
              />
            ))}
          </ProfileOverviewFollowList>
        )}
      </ProfileOverviewPopoverScroll>
    </div>
  );
}

export function ProfileFollowStatPopover({
  profileId,
  kind,
  label,
  value,
}: {
  profileId: string;
  kind: "followers" | "following";
  label: string;
  value: string;
}) {
  const navigate = useNavigate();
  const isMobile = useMaxSm();
  const [open, setOpen] = useState(false);
  const listQuery = useQuery({
    queryKey: ["profile_follow_list", profileId, kind],
    queryFn: () => fetchProfileFollowList(profileId, kind, supabase),
    enabled: open,
  });

  const users = listQuery.data ?? [];
  const title = kind === "followers" ? "Followers" : "Following";
  const numericValue = Number(value.replace(/[^\d]/g, "")) || 0;

  const close = () => setOpen(false);
  const selectUser = (slug: string) => {
    close();
    navigate(publicProfileHref(slug));
  };

  const trigger = (
    <ProfileOverviewStatButton
      label={label}
      value={value}
      aria-label={`${label}: ${value}`}
      aria-expanded={open}
      onClick={isMobile ? () => setOpen(true) : undefined}
    />
  );

  const panel = (
    <ProfileFollowListPanel
      kind={kind}
      title={title}
      value={value}
      numericValue={numericValue}
      users={users}
      isPending={listQuery.isPending}
      isError={listQuery.isError}
      onSelectUser={selectUser}
    />
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title={title}
          containBody
          partialHeight="min(70dvh, 28rem)"
        >
          <ProfileOverviewFollowSheetBody>
            {panel}
          </ProfileOverviewFollowSheetBody>
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        side="right"
        align="start"
        sideOffset={10}
        className={profileOverviewStyles.popoverPanel}
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
}
