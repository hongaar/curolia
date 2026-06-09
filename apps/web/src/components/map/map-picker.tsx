import { MapPickerMenuContent } from "@/components/map/map-picker-menu-content";
import { useNavigateToMapSettings } from "@/hooks/use-navigate-to-map-settings";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { useMap } from "@/providers/map-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import { DropdownMenu } from "@curolia/ui/dropdown-menu";
import { MapPickerContent, MapPickerTrigger } from "@curolia/ui/map-picker";
import { useState } from "react";

export function MapPicker() {
  const navigateToMapSettings = useNavigateToMapSettings();
  const { maps, activeMap } = useMap();
  const { openNewMapDialog } = useNavigationShell();
  const [open, setOpen] = useState(false);

  const mapEmoji = activeMap
    ? (activeMap.icon_emoji ?? defaultMapIcon())
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
          onOpenMapSettings={(route) => {
            navigateToMapSettings(route);
            setOpen(false);
          }}
          onNewMap={() => openNewMapDialog()}
        />
      </MapPickerContent>
    </DropdownMenu>
  );
}
