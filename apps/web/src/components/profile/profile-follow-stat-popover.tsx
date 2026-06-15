import { UserAvatar } from "@/components/user-avatar";
import { fetchProfileFollowList } from "@/lib/fetch-profile-follow-list";
import { publicProfileHref } from "@/lib/profile-route";
import { supabase } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@curolia/ui/popover";
import {
  ProfileOverviewFollowList,
  ProfileOverviewFollowListItem,
  ProfileOverviewFollowPopoverHeader,
  ProfileOverviewPopoverScroll,
  ProfileOverviewStatButton,
  profileOverviewStyles,
} from "@curolia/ui/profile-overview";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [open, setOpen] = useState(false);
  const listQuery = useQuery({
    queryKey: ["profile_follow_list", profileId, kind],
    queryFn: () => fetchProfileFollowList(profileId, kind, supabase),
    enabled: open,
  });

  const users = listQuery.data ?? [];
  const title = kind === "followers" ? "Followers" : "Following";
  const numericValue = Number(value.replace(/[^\d]/g, "")) || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <ProfileOverviewStatButton
            label={label}
            value={value}
            aria-label={`${label}: ${value}`}
            aria-expanded={open}
          />
        }
      />
      <PopoverContent
        side="right"
        align="start"
        sideOffset={10}
        className={profileOverviewStyles.popoverPanel}
      >
        <div className={profileOverviewStyles.popoverSurface}>
          <ProfileOverviewFollowPopoverHeader
            title={title}
            count={numericValue > 0 ? value : undefined}
          />
          <ProfileOverviewPopoverScroll>
            {listQuery.isPending ? (
              <p className={profileOverviewStyles.popoverEmpty}>Loading…</p>
            ) : listQuery.isError ? (
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
                    handle={`@${user.slug}`}
                    onClick={() => {
                      setOpen(false);
                      navigate(publicProfileHref(user.slug));
                    }}
                  />
                ))}
              </ProfileOverviewFollowList>
            )}
          </ProfileOverviewPopoverScroll>
        </div>
      </PopoverContent>
    </Popover>
  );
}
