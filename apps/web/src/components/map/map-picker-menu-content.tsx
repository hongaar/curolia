import { mapSwitchHref } from "@/lib/app-paths";
import { defaultMapIcon } from "@/lib/map-display-icon";
import type { CuroliaMap } from "@/types/database";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import {
  MapDropdownEditButton,
  MapDropdownRow,
  SidebarCheckIcon,
  SidebarCheckSpacer,
  SidebarDropdownMenuItem,
  SidebarMapEmoji,
  SidebarMapName,
} from "@curolia/ui/navigation-sidebar";
import { Check, Pencil, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function mapEmoji(map: CuroliaMap) {
  return map.icon_emoji ?? defaultMapIcon(map.is_personal);
}

type MapPickerMenuContentProps = {
  maps: CuroliaMap[];
  activeMapId: string | null | undefined;
  onOpenMapSettings: (mapId: string) => void;
  onNewMap: () => void;
};

export function MapPickerMenuContent({
  maps,
  activeMapId,
  onOpenMapSettings,
  onNewMap,
}: MapPickerMenuContentProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>Maps</DropdownMenuLabel>
        {maps.map((j) => {
          const selected = j.id === activeMapId;
          return (
            <MapDropdownRow key={j.id}>
              <SidebarDropdownMenuItem
                onClick={() => {
                  navigate(mapSwitchHref(j, pathname, search));
                }}
              >
                <SidebarMapEmoji>{mapEmoji(j)}</SidebarMapEmoji>
                <SidebarMapName selected={selected} personal={j.is_personal}>
                  {j.name}
                </SidebarMapName>
                {selected ? (
                  <SidebarCheckIcon>
                    <Check aria-hidden />
                  </SidebarCheckIcon>
                ) : (
                  <SidebarCheckSpacer />
                )}
              </SidebarDropdownMenuItem>
              <MapDropdownEditButton
                title="Edit map"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenMapSettings(j.id);
                }}
              >
                <Pencil aria-hidden />
              </MapDropdownEditButton>
            </MapDropdownRow>
          );
        })}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onNewMap()}>
        <Plus aria-hidden />
        New map…
      </DropdownMenuItem>
    </>
  );
}
