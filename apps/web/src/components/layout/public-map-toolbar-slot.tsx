import { defaultMapIcon } from "@/lib/map-display-icon";
import { useMap } from "@/providers/map-provider";
import { PublicMapToolbarInfo } from "@curolia/ui/map-picker";

export function PublicMapToolbarSlot() {
  const { activeMap, publicView } = useMap();

  if (!publicView || !activeMap) return null;

  const mapEmoji = activeMap.icon_emoji ?? defaultMapIcon();

  return (
    <PublicMapToolbarInfo
      mapEmoji={mapEmoji}
      mapName={activeMap.name.trim() || "Map"}
    />
  );
}
