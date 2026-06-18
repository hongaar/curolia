import { supabase } from "@/lib/supabase";
import { usePinMetaSummaryPlugins } from "@/lib/use-pin-meta-summary-plugins";
import { useAuth } from "@/providers/auth-provider";
import { BlogPinCardMeta } from "@curolia/ui/blog";

type PinBlogMetaSummariesProps = {
  mapId: string;
  pinId: string;
};

export function PinBlogMetaSummaries({
  mapId,
  pinId,
}: PinBlogMetaSummariesProps) {
  const { user } = useAuth();
  const { metaSummaryPlugins } = usePinMetaSummaryPlugins(mapId);

  if (metaSummaryPlugins.length === 0) return null;

  return (
    <BlogPinCardMeta>
      {metaSummaryPlugins.map((plugin) => {
        const Summary = plugin.PinMetaSummary;
        if (!Summary) return null;
        return (
          <Summary
            key={plugin.id}
            supabase={supabase}
            userId={user?.id}
            pinId={pinId}
            mapId={mapId}
            pinSurface="display"
          />
        );
      })}
    </BlogPinCardMeta>
  );
}
