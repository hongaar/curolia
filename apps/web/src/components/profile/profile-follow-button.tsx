import type { FollowStatus } from "@/lib/fetch-profile-follow-stats";
import { Button } from "@curolia/ui/button";
import { Clock, UserMinus, UserPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function ProfileFollowButton({
  followStatus,
  requiresApproval = false,
  busy,
  canFollow,
  onToggle,
}: {
  followStatus: FollowStatus | null;
  /** Restricted profiles: following sends a request the owner approves. */
  requiresApproval?: boolean;
  busy: boolean;
  canFollow: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const followLabel = requiresApproval ? "Request to follow" : "Follow";

  if (!canFollow) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return (
      <Button variant="default" render={<Link to={`/login?next=${next}`} />}>
        <UserPlus aria-hidden size={16} />
        {followLabel}
      </Button>
    );
  }

  return (
    <Button
      variant={followStatus ? "outline" : "default"}
      disabled={busy}
      onClick={() => void onToggle()}
    >
      {followStatus === "approved" ? (
        <>
          <UserMinus aria-hidden size={16} />
          Following
        </>
      ) : followStatus === "pending" ? (
        <>
          <Clock aria-hidden size={16} />
          Requested
        </>
      ) : (
        <>
          <UserPlus aria-hidden size={16} />
          {followLabel}
        </>
      )}
    </Button>
  );
}
