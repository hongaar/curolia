import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pinCommentsQueryKey } from "./query-keys";
import type { PinCommentRow } from "./types";

export function usePinComments(
  supabase: SupabaseClient,
  pinId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: pinCommentsQueryKey(pinId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pin_comments")
        .select("*")
        .eq("pin_id", pinId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PinCommentRow[];
    },
    enabled: Boolean(pinId) && enabled,
  });
}

type AddCommentInput = {
  pinId: string;
  mapId: string;
  body: string;
  authorDisplayName: string;
  authorUserId?: string | null;
  authorGuestId?: string | null;
};

export function useAddPinComment(supabase: SupabaseClient, pinId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddCommentInput) => {
      const { error } = await supabase.from("pin_comments").insert({
        pin_id: input.pinId,
        map_id: input.mapId,
        body: input.body.trim(),
        author_display_name: input.authorDisplayName.trim(),
        author_user_id: input.authorUserId ?? null,
        author_guest_id: input.authorGuestId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: pinCommentsQueryKey(pinId) });
    },
  });
}

export function useDeletePinComment(supabase: SupabaseClient, pinId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      commentId: string;
      guestId?: string | null;
    }) => {
      let query = supabase
        .from("pin_comments")
        .delete()
        .eq("id", input.commentId);
      if (input.guestId) {
        query = query.eq("author_guest_id", input.guestId);
      }
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: pinCommentsQueryKey(pinId) });
    },
  });
}
