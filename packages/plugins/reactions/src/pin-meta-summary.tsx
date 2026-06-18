import type { PinMetaSummaryProps } from "@curolia/plugin-contract";
import { CardMetaEmojiIcon, CardMetaItem } from "@curolia/ui/card-meta";
import { useMemo } from "react";
import { groupPinReactions } from "./group-reactions";
import { getOrCreateGuestId } from "./guest-id";
import { usePinReactions } from "./use-pin-reactions";

const MAX_SUMMARY_GROUPS = 4;

export function ReactionsPinMetaSummary({
  supabase,
  userId,
  pinId,
}: PinMetaSummaryProps) {
  const reactionsQuery = usePinReactions(supabase, pinId);
  const guestId = useMemo(
    () => (userId ? null : getOrCreateGuestId()),
    [userId],
  );

  const groups = useMemo(
    () =>
      groupPinReactions(reactionsQuery.data ?? [], {
        userId,
        guestId,
      }).slice(0, MAX_SUMMARY_GROUPS),
    [reactionsQuery.data, userId, guestId],
  );

  if (reactionsQuery.isLoading || groups.length === 0) return null;

  return (
    <>
      {groups.map((group) => (
        <CardMetaItem
          key={group.emoji}
          icon={<CardMetaEmojiIcon emoji={group.emoji} />}
        >
          {group.count}
        </CardMetaItem>
      ))}
    </>
  );
}
