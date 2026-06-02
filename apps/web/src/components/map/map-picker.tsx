import { MapPickerMenuContent } from "@/components/map/map-picker-menu-content";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { useMap } from "@/providers/map-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import { DropdownMenu } from "@curolia/ui/dropdown-menu";
import { MapPickerContent, MapPickerTrigger } from "@curolia/ui/map-picker";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function MapPicker() {
  const navigate = useNavigate();
  const { maps, activeMap } = useMap();
  const { openNewMapDialog } = useNavigationShell();
  const [open, setOpen] = useState(false);

  const mapEmoji = activeMap
    ? (activeMap.icon_emoji ?? defaultMapIcon(activeMap.is_personal))
    : null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <MapPickerTrigger
        mapEmoji={mapEmoji}
        mapName={activeMap?.name}
        aria-label="Select map"
      />
      <MapPickerContent>
        <MapPickerMenuContent
          maps={maps}
          activeMapId={activeMap?.id}
          onOpenMapSettings={(mapId) => {
            void navigate(`/maps/${mapId}/settings`);
            setOpen(false);
          }}
          onNewMap={() => openNewMapDialog()}
        />
      </MapPickerContent>
    </DropdownMenu>
  );
}
