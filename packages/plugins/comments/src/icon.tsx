import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";
import { MessageCircle } from "lucide-react";

export function CommentsIcon({
  size = 5,
}: {
  className?: string;
  size?: 4 | 5 | 6;
}) {
  return (
    <PluginIconFrame size={size}>
      <MessageCircle aria-hidden width="100%" height="100%" strokeWidth={2} />
    </PluginIconFrame>
  );
}
