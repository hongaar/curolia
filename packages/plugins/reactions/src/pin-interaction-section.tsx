import type { PinInteractionSectionProps } from "@curolia/plugin-contract";
import { PinReactionBar } from "@curolia/ui/pin-reactions";
import { PluginPinError, PluginPinSpinner } from "@curolia/ui/plugin-pin";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { QUICK_REACTION_EMOJIS, normalizeReactionEmoji } from "./emojis";
import { groupPinReactions } from "./group-reactions";
import { getOrCreateGuestId } from "./guest-id";
import { usePinReactions, useTogglePinReaction } from "./use-pin-reactions";
import { useReactionPolicy } from "./use-reaction-policy";

export function ReactionsPinInteractionSection({
  supabase,
  userId,
  pinId,
  mapId,
}: PinInteractionSectionProps) {
  const reactionsQuery = usePinReactions(supabase, pinId);
  const toggleReaction = useTogglePinReaction(supabase, pinId);
  const guestId = useMemo(
    () => (userId ? null : getOrCreateGuestId()),
    [userId],
  );

  const memberQuery = useQuery({
    queryKey: ["map_member", mapId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("map_members")
        .select("user_id")
        .eq("map_id", mapId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    enabled: Boolean(mapId && userId),
  });

  const { canReact, isLoading } = useReactionPolicy({
    supabase,
    mapId,
    isMapMember: memberQuery.data === true,
  });

  const groups = useMemo(
    () =>
      groupPinReactions(reactionsQuery.data ?? [], {
        userId,
        guestId,
      }),
    [reactionsQuery.data, userId, guestId],
  );

  const groupByEmoji = useMemo(
    () => new Map(groups.map((group) => [group.emoji, group])),
    [groups],
  );

  const policyLoading = isLoading || memberQuery.isLoading;

  if (policyLoading || reactionsQuery.isLoading) {
    return <PluginPinSpinner />;
  }

  const hasReactions = groups.length > 0;
  if (!canReact && !hasReactions) {
    return null;
  }

  const actor = {
    userId: userId ?? null,
    guestId: userId ? null : guestId,
  };

  const toggle = async (emoji: string) => {
    const normalized = normalizeReactionEmoji(emoji);
    if (!normalized) return;
    const existing = groupByEmoji.get(normalized);
    try {
      await toggleReaction.mutateAsync({
        pinId,
        mapId,
        emoji: normalized,
        userId: actor.userId,
        guestId: actor.guestId,
        reactionId: existing?.reactionId ?? null,
        remove: existing?.reactedByMe === true,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update reaction");
    }
  };

  return (
    <>
      <PinReactionBar
        reactions={groups.map((group) => ({
          emoji: group.emoji,
          count: group.count,
          active: group.reactedByMe,
        }))}
        quickAddEmojis={canReact ? QUICK_REACTION_EMOJIS : []}
        interactive={canReact}
        disabled={toggleReaction.isPending}
        onToggle={canReact ? (emoji) => void toggle(emoji) : undefined}
        onCustomEmoji={canReact ? (emoji) => void toggle(emoji) : undefined}
      />
      {toggleReaction.isError ? (
        <PluginPinError>
          {toggleReaction.error instanceof Error
            ? toggleReaction.error.message
            : "Could not update reaction"}
        </PluginPinError>
      ) : null}
    </>
  );
}
