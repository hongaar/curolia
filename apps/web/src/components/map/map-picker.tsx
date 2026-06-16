import { MapPickerMenuContent } from "@/components/map/map-picker-menu-content";
import { useNavigateToMapSettings } from "@/hooks/use-navigate-to-map-settings";
import { mapViewHref } from "@/lib/app-paths";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { mapRouteForMap } from "@/lib/map-route";
import { resolveMemberMapHomeHref } from "@/lib/member-map-home";
import { isBaseRoute } from "@/lib/stack-routes";
import { getStoredActiveMapId } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import { DropdownMenu } from "@curolia/ui/dropdown-menu";
import {
  MapNavButton,
  MapPickerContent,
  MapPickerTrigger,
} from "@curolia/ui/map-picker";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function MapPicker() {
  const navigateToMapSettings = useNavigateToMapSettings();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { memberMaps, activeMap } = useMap();
  const { openNewMapDialog } = useNavigationShell();
  const [open, setOpen] = useState(false);
  const onMapBase = isBaseRoute(pathname);

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

  const activeMapHref = useMemo(() => {
    if (activeMap?.owner_profile_slug && activeMap.slug.trim()) {
      return mapViewHref("map", mapRouteForMap(activeMap));
    }
    return resolveMemberMapHomeHref(memberMaps, getStoredActiveMapId());
  }, [activeMap, memberMaps]);

  if (!onMapBase) {
    return (
      <MapNavButton
        mapEmoji={mapEmoji}
        mapName={activeMap?.name?.trim() || "Map"}
        onClick={() => navigate(activeMapHref)}
        aria-label="Go to map"
      />
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <MapPickerTrigger
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
            onOpenMapSettings={(route) => {
              navigateToMapSettings(route);
              setOpen(false);
            }}
            onNewMap={() => openNewMapDialog()}
          />
        )}
      </MapPickerContent>
    </DropdownMenu>
  );
}
