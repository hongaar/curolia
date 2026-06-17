import { UserAvatar } from "@curolia/ui/user-avatar";
import { gravatarUrlFromHash } from "./gravatar-url";
import type { PinCommentRow } from "./types";

export function CommentAuthorAvatar({ comment }: { comment: PinCommentRow }) {
  const profile = comment.author_profile;
  const name = comment.author_display_name;
  const gravatarUrl = profile?.gravatar_hash
    ? gravatarUrlFromHash(profile.gravatar_hash)
    : null;

  return (
    <UserAvatar
      storedAvatarUrl={profile?.avatar_url}
      email={null}
      gravatarUrl={gravatarUrl}
      size="xs"
      label={name}
    />
  );
}
