import { normalizeReactionEmoji } from "./emojis";
import type { PinReactionRow, ReactionGroup } from "./types";

export function groupPinReactions(
  rows: PinReactionRow[],
  actor: { userId?: string | null; guestId?: string | null },
): ReactionGroup[] {
  const byEmoji = new Map<string, ReactionGroup>();

  for (const row of rows) {
    const emoji = normalizeReactionEmoji(row.emoji);
    const existing = byEmoji.get(emoji);
    const reactedByMe =
      (actor.userId != null && row.user_id === actor.userId) ||
      (actor.guestId != null && row.guest_id === actor.guestId);

    if (existing) {
      existing.count += 1;
      if (reactedByMe) {
        existing.reactedByMe = true;
        existing.reactionId = row.id;
      }
    } else {
      byEmoji.set(emoji, {
        emoji,
        count: 1,
        reactedByMe,
        reactionId: reactedByMe ? row.id : null,
      });
    }
  }

  return [...byEmoji.values()].sort((a, b) => b.count - a.count);
}
