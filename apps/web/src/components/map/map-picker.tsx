import { MapPickerMenuContent } from "@/components/map/map-picker-menu-content";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { resolveMemberMapHomeHref } from "@/lib/member-map-home";
import { getStoredActiveMapId } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import { DropdownMenu } from "@curolia/ui/dropdown-menu";
import { MapPickerContent, MapPickerTrigger } from "@curolia/ui/map-picker";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export function MapPicker({
  density = "auto",
}: {
  density?: "auto" | "compact";
} = {}) {
  const navigate = useNavigate();
  const { memberMaps, activeMap } = useMap();
  const { openNewMapDialog } = useNavigationShell();
  const [open, setOpen] = useState(false);

  const viewingForeignMap = useMemo(
    () =>
      Boolean(activeMap && !memberMaps.some((map) => map.id === activeMap.id)),
    [activeMap, memberMaps],
  );

  const backToMyMapsHref = useMemo(
    () => resolveMemberMapHomeHref(memberMaps, getStoredActiveMapId()),
    [memberMaps],
  );

  const mapEmoji = activeMap
    ? (activeMap.icon_emoji ?? defaultMapIcon())
    : null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <MapPickerTrigger
        density={density}
        mapEmoji={mapEmoji}
        mapName={activeMap?.name}
        aria-label={viewingForeignMap ? "Map menu" : "Select map"}
      />
      <MapPickerContent>
        {viewingForeignMap ? (
          <MapPickerMenuContent
            variant="foreign"
            onBackToMyMaps={() => {
              navigate(backToMyMapsHref);
              setOpen(false);
            }}
          />
        ) : (
          <MapPickerMenuContent
            variant="member"
            maps={memberMaps}
            activeMapId={activeMap?.id}
            onNewMap={() => openNewMapDialog()}
          />
        )}
      </MapPickerContent>
    </DropdownMenu>
  );
}
