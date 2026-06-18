import type { PinMetaSummaryProps } from "@curolia/plugin-contract";
import { CardMetaItem } from "@curolia/ui/card-meta";
import { MessageCircle } from "lucide-react";
import { usePinComments } from "./use-pin-comments";

function formatCommentCount(count: number): string {
  return count === 1 ? "1 comment" : `${count} comments`;
}

export function CommentsPinMetaSummary({
  supabase,
  pinId,
}: PinMetaSummaryProps) {
  const commentsQuery = usePinComments(supabase, pinId);

  if (commentsQuery.isLoading) return null;

  const count = commentsQuery.data?.length ?? 0;
  if (count === 0) return null;

  return (
    <CardMetaItem icon={<MessageCircle aria-hidden />}>
      {formatCommentCount(count)}
    </CardMetaItem>
  );
}
