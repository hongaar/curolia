import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pinReactionsQueryKey } from "./query-keys";
import type { PinReactionRow } from "./types";

export function usePinReactions(
  supabase: SupabaseClient,
  pinId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: pinReactionsQueryKey(pinId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pin_reactions")
        .select("*")
        .eq("pin_id", pinId);
      if (error) throw error;
      return (data ?? []) as PinReactionRow[];
    },
    enabled: Boolean(pinId) && enabled,
  });
}

type ToggleReactionInput = {
  pinId: string;
  mapId: string;
  emoji: string;
  userId?: string | null;
  guestId?: string | null;
  reactionId?: string | null;
  remove: boolean;
};

export function useTogglePinReaction(supabase: SupabaseClient, pinId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ToggleReactionInput) => {
      if (input.remove) {
        let query = supabase.from("pin_reactions").delete().eq("pin_id", pinId);
        if (input.reactionId) {
          query = query.eq("id", input.reactionId);
        } else {
          query = query.eq("emoji", input.emoji);
          if (input.userId) {
            query = query.eq("user_id", input.userId);
          } else if (input.guestId) {
            query = query.eq("guest_id", input.guestId);
          }
        }
        const { error } = await query;
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("pin_reactions").insert({
        pin_id: input.pinId,
        map_id: input.mapId,
        emoji: input.emoji,
        user_id: input.userId ?? null,
        guest_id: input.guestId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: pinReactionsQueryKey(pinId) });
    },
  });
}
