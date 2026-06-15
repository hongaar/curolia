import { Button } from "@curolia/ui/button";
import { UserMinus, UserPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function ProfileFollowButton({
  isFollowing,
  busy,
  canFollow,
  onToggle,
}: {
  isFollowing: boolean;
  busy: boolean;
  canFollow: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();

  if (!canFollow) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return (
      <Button variant="default" render={<Link to={`/login?next=${next}`} />}>
        <UserPlus aria-hidden size={16} />
        Follow
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      disabled={busy}
      onClick={() => void onToggle()}
    >
      {isFollowing ? (
        <>
          <UserMinus aria-hidden size={16} />
          Following
        </>
      ) : (
        <>
          <UserPlus aria-hidden size={16} />
          Follow
        </>
      )}
    </Button>
  );
}
