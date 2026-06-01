import { MapPickerMenuContent } from "@/components/map/map-picker-menu-content";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { useMap } from "@/providers/map-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import { DropdownMenu } from "@curolia/ui/dropdown-menu";
import { MapPickerContent, MapPickerTrigger } from "@curolia/ui/map-picker";
import { useNavigate } from "react-router-dom";

export function MapPicker() {
  const navigate = useNavigate();
  const { maps, activeMap } = useMap();
  const { openNewMapDialog } = useNavigationShell();

  const mapEmoji = activeMap
    ? (activeMap.icon_emoji ?? defaultMapIcon(activeMap.is_personal))
    : null;

  return (
    <DropdownMenu>
      <MapPickerTrigger
        mapEmoji={mapEmoji}
        mapName={activeMap?.name}
        aria-label="Select map"
      />
      <MapPickerContent>
        <MapPickerMenuContent
          maps={maps}
          activeMapId={activeMap?.id}
          onOpenMapSettings={(mapId) =>
            void navigate(`/maps/${mapId}/settings`)
          }
          onNewMap={() => openNewMapDialog()}
        />
      </MapPickerContent>
    </DropdownMenu>
  );
}
