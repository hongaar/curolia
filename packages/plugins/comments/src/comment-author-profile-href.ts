import type { PinCommentRow } from "./types";

/** Public profile path for a signed-in comment author, when their slug is visible. */
export function commentAuthorProfileHref(
  comment: PinCommentRow,
): string | undefined {
  const slug = comment.author_profile?.slug?.trim();
  if (!slug || !comment.author_user_id) return undefined;
  return `/${slug}`;
}
