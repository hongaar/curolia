import { UserAvatar } from "@/components/user-avatar";
import { useMaxSm } from "@/hooks/use-max-sm";
import {
  fetchPendingFollowRequests,
  fetchProfileFollowList,
  type ProfileFollowListUser,
} from "@/lib/fetch-profile-follow-list";
import { publicProfileHref } from "@/lib/profile-route";
import { supabase } from "@/lib/supabase";
import { BottomSheet } from "@curolia/ui/bottom-sheet";
import { Button } from "@curolia/ui/button";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import { useNavigate } from "react-router-dom";

function FollowUserAvatar({ user }: { user: ProfileFollowListUser }) {
  return (
    <UserAvatar
      storedAvatarUrl={user.avatarUrl}
      email={null}
      gravatarHash={user.gravatarHash}
      gravatarFallback
      gravatarSize={48}
      size="sm"
      label={user.displayName}
    />
  );
}

function FollowRequestsSection({
  requests,
  busyId,
  onSelectUser,
  onRespond,
}: {
  requests: ProfileFollowListUser[];
  busyId: string | null;
  onSelectUser: (slug: string) => void;
  onRespond: (followerId: string, approve: boolean) => void;
}) {
  if (requests.length === 0) return null;
  return (
    <>
      <ProfileOverviewFollowPopoverHeader
        title="Requests"
        count={requests.length.toLocaleString()}
      />
      <ProfileOverviewFollowList>
        {requests.map((user) => (
          <ProfileOverviewFollowListItem
            key={user.profileId}
            avatar={<FollowUserAvatar user={user} />}
            name={user.displayName}
            onClick={
              user.isPrivate || !user.slug
                ? undefined
                : () => onSelectUser(user.slug!)
            }
            actions={
              <>
                <Button
                  size="sm"
                  disabled={busyId === user.profileId}
                  onClick={() => onRespond(user.profileId, true)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === user.profileId}
                  onClick={() => onRespond(user.profileId, false)}
                >
                  Decline
                </Button>
              </>
            }
          />
        ))}
      </ProfileOverviewFollowList>
    </>
  );
}

function ProfileFollowListPanel({
  requestsSection,
  kind,
  title,
  value,
  numericValue,
  users,
  isPending,
  isError,
  onSelectUser,
  onRemoveUser,
}: {
  requestsSection?: ReactNode;
  /** When set, each row gets a remove button (owner of a restricted profile). */
  onRemoveUser?: (user: ProfileFollowListUser) => void;
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
      {requestsSection}
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
                avatar={<FollowUserAvatar user={user} />}
                name={user.displayName}
                onClick={
                  user.isPrivate || !user.slug
                    ? undefined
                    : () => onSelectUser(user.slug!)
                }
                trailing={
                  onRemoveUser ? (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Remove follower ${user.displayName}`}
                      onClick={() => onRemoveUser(user)}
                    >
                      <UserMinus aria-hidden size={16} />
                    </Button>
                  ) : undefined
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
  showRequests = false,
  canRemoveFollowers = false,
  defaultOpen = false,
}: {
  profileId: string;
  kind: "followers" | "following";
  label: string;
  value: string;
  /** Owner of the profile: list pending follow requests above followers. */
  showRequests?: boolean;
  /** Owner of a restricted profile: allow removing approved followers. */
  canRemoveFollowers?: boolean;
  defaultOpen?: boolean;
}) {
  const navigate = useNavigate();
  const isMobile = useMaxSm();
  const qc = useQueryClient();
  const [open, setOpen] = useState(defaultOpen);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Owner's followers trigger: always load requests to show the dot.
  const requestsQuery = useQuery({
    queryKey: ["profile_follow_requests", profileId],
    queryFn: () => fetchPendingFollowRequests(supabase),
    enabled: showRequests && kind === "followers",
  });
  const hasPendingRequests =
    showRequests &&
    kind === "followers" &&
    (requestsQuery.data?.length ?? 0) > 0;

  async function removeFollower(follower: ProfileFollowListUser) {
    const { error } = await supabase.rpc("remove_follower", {
      p_follower_id: follower.profileId,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Removed ${follower.displayName}`);
    await qc.invalidateQueries({
      queryKey: ["profile_follow_list", profileId],
    });
    await qc.invalidateQueries({ queryKey: ["public_profile"] });
  }

  async function respond(followerId: string, approve: boolean) {
    setBusyId(followerId);
    const { error } = await supabase.rpc(
      approve ? "approve_follow_request" : "decline_follow_request",
      { p_follower_id: followerId },
    );
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(approve ? "Request approved" : "Request declined");
    await qc.invalidateQueries({
      queryKey: ["profile_follow_requests", profileId],
    });
    await qc.invalidateQueries({
      queryKey: ["profile_follow_list", profileId],
    });
    await qc.invalidateQueries({ queryKey: ["public_profile"] });
  }
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
      indicator={hasPendingRequests}
      aria-label={
        hasPendingRequests
          ? `${label}: ${value}, pending follow requests`
          : `${label}: ${value}`
      }
      aria-expanded={open}
      onClick={isMobile ? () => setOpen(true) : undefined}
    />
  );

  const panel = (
    <ProfileFollowListPanel
      requestsSection={
        showRequests && kind === "followers" ? (
          <FollowRequestsSection
            requests={requestsQuery.data ?? []}
            busyId={busyId}
            onSelectUser={selectUser}
            onRespond={(id, approve) => void respond(id, approve)}
          />
        ) : null
      }
      kind={kind}
      onRemoveUser={
        canRemoveFollowers && kind === "followers"
          ? (follower) => void removeFollower(follower)
          : undefined
      }
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
