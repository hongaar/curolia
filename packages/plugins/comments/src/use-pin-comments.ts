import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pinCommentsQueryKey } from "./query-keys";
import type { PinCommentAuthorProfile, PinCommentRow } from "./types";

async function fetchCommentAuthorProfiles(
  supabase: SupabaseClient,
  authorUserIds: string[],
): Promise<Record<string, PinCommentAuthorProfile>> {
  if (authorUserIds.length === 0) return {};

  const { data, error } = await supabase
    .from("profiles")
    .select("id, avatar_url, gravatar_hash")
    .in("id", authorUserIds);
  if (error) throw error;

  return Object.fromEntries(
    (data ?? []).map((profile) => [
      profile.id,
      {
        avatar_url: profile.avatar_url?.trim() || null,
        gravatar_hash: profile.gravatar_hash?.trim() || null,
      },
    ]),
  );
}

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

      const rows = (data ?? []) as Omit<PinCommentRow, "author_profile">[];
      const authorUserIds = [
        ...new Set(
          rows
            .map((row) => row.author_user_id)
            .filter((id): id is string => id != null),
        ),
      ];
      const profilesById = await fetchCommentAuthorProfiles(
        supabase,
        authorUserIds,
      );

      return rows.map((row) => ({
        ...row,
        author_profile: row.author_user_id
          ? (profilesById[row.author_user_id] ?? null)
          : null,
      })) satisfies PinCommentRow[];
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
