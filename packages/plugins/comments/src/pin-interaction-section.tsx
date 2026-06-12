import type { PinInteractionSectionProps } from "@curolia/plugin-contract";
import { Button } from "@curolia/ui/button";
import { Input } from "@curolia/ui/input";
import {
  PluginPinCard,
  PluginPinContent,
  PluginPinError,
  PluginPinHeader,
  PluginPinItemMain,
  PluginPinItemRow,
  PluginPinList,
  PluginPinMuted,
  PluginPinTitleRow,
} from "@curolia/ui/plugin-pin";
import { Separator } from "@curolia/ui/separator";
import { Textarea } from "@curolia/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getStoredCommentDisplayName,
  setStoredCommentDisplayName,
} from "./display-name-storage";
import { formatCommentDate } from "./format-comment-date";
import { getOrCreateGuestId } from "./guest-id";
import { CommentsIcon } from "./icon";
import { commentsPluginMeta } from "./plugin-meta";
import { useCommentPolicy } from "./use-comment-policy";
import { useMapMemberAccess } from "./use-map-member-access";
import {
  useAddPinComment,
  useDeletePinComment,
  usePinComments,
} from "./use-pin-comments";

export function CommentsPinInteractionSection({
  supabase,
  userId,
  pinId,
  mapId,
}: PinInteractionSectionProps) {
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState(() =>
    userId ? "" : getStoredCommentDisplayName(),
  );
  const commentsQuery = usePinComments(supabase, pinId);
  const addComment = useAddPinComment(supabase, pinId);
  const deleteComment = useDeletePinComment(supabase, pinId);
  const guestId = useMemo(
    () => (userId ? null : getOrCreateGuestId()),
    [userId],
  );

  const memberAccessQuery = useMapMemberAccess(supabase, mapId, userId);

  const profileQuery = useQuery({
    queryKey: ["profiles", userId, "display_name"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data?.display_name?.trim() ?? "Traveler";
    },
    enabled: Boolean(userId),
  });

  const { canComment, requiresName, isLoading } = useCommentPolicy({
    supabase,
    mapId,
    userId,
    isMapMember: memberAccessQuery.data?.isMember === true,
  });

  const canModerateComments =
    memberAccessQuery.data?.canModerateComments === true;

  const comments = commentsQuery.data ?? [];
  const policyLoading = isLoading || memberAccessQuery.isLoading;

  if (policyLoading || commentsQuery.isLoading) {
    return (
      <PluginPinCard>
        <PluginPinHeader>
          <PluginPinTitleRow
            icon={<CommentsIcon />}
            title={commentsPluginMeta.displayName}
          />
        </PluginPinHeader>
        <PluginPinContent>
          <PluginPinMuted>Loading comments…</PluginPinMuted>
        </PluginPinContent>
      </PluginPinCard>
    );
  }

  if (!canComment && comments.length === 0) {
    return null;
  }

  const resolvedName = userId
    ? (profileQuery.data ?? "Traveler")
    : displayName.trim();

  const submit = async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      toast.error("Write a comment first");
      return;
    }
    if (requiresName && !resolvedName) {
      toast.error("Enter your name");
      return;
    }
    if (!userId) {
      setStoredCommentDisplayName(resolvedName);
    }
    try {
      await addComment.mutateAsync({
        pinId,
        mapId,
        body: trimmedBody,
        authorDisplayName: resolvedName,
        authorUserId: userId ?? null,
        authorGuestId: userId ? null : getOrCreateGuestId(),
      });
      setBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post comment");
    }
  };

  return (
    <PluginPinCard>
      <PluginPinHeader>
        <PluginPinTitleRow
          icon={<CommentsIcon />}
          title={commentsPluginMeta.displayName}
        />
      </PluginPinHeader>
      <PluginPinContent>
        {comments.length > 0 ? (
          <PluginPinList>
            {comments.map((comment) => {
              const isAuthor =
                (userId != null && comment.author_user_id === userId) ||
                (!userId &&
                  comment.author_guest_id != null &&
                  guestId != null &&
                  comment.author_guest_id === guestId);
              const canRemove = isAuthor || canModerateComments;
              const removeLabel = isAuthor
                ? "Delete your comment"
                : "Remove comment";
              return (
                <PluginPinItemRow key={comment.id}>
                  <PluginPinItemMain>
                    <strong>{comment.author_display_name}</strong>
                    <PluginPinMuted>
                      {formatCommentDate(comment.created_at)}
                    </PluginPinMuted>
                    <p>{comment.body}</p>
                  </PluginPinItemMain>
                  {canRemove ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={removeLabel}
                      disabled={deleteComment.isPending}
                      onClick={() =>
                        void deleteComment.mutateAsync({
                          commentId: comment.id,
                          guestId: isAuthor ? guestId : null,
                        })
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  ) : null}
                </PluginPinItemRow>
              );
            })}
          </PluginPinList>
        ) : null}
        {canComment ? (
          <>
            {comments.length > 0 ? <Separator /> : null}
            {requiresName ? (
              <Input
                id="comment-author-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            ) : null}
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment…"
              rows={3}
            />
            <Button
              size="sm"
              disabled={addComment.isPending || !body.trim()}
              onClick={() => void submit()}
            >
              Post comment
            </Button>
            {addComment.isError ? (
              <PluginPinError>
                {addComment.error instanceof Error
                  ? addComment.error.message
                  : "Could not post comment"}
              </PluginPinError>
            ) : null}
          </>
        ) : null}
      </PluginPinContent>
    </PluginPinCard>
  );
}
