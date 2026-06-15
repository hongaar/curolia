import { mapSwitchHref, type MapWithOwnerSlug } from "@/lib/app-paths";
import { defaultMapIcon } from "@/lib/map-display-icon";
import type { MapRoute } from "@/lib/map-route";
import { mapRouteForMap } from "@/lib/map-route";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import {
  DropdownMenuCheckIcon,
  DropdownMenuCheckItem,
  DropdownMenuCheckSpacer,
  DropdownMenuEditButton,
  DropdownMenuEditRow,
  DropdownMenuItemEmoji,
  DropdownMenuItemName,
} from "@curolia/ui/dropdown-menu-list";
import { Check, Plus, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function mapEmoji(map: MapWithOwnerSlug) {
  return map.icon_emoji ?? defaultMapIcon();
}

type MapPickerMemberMenuContentProps = {
  variant: "member";
  maps: MapWithOwnerSlug[];
  activeMapId: string | null | undefined;
  onOpenMapSettings: (route: MapRoute) => void;
  onNewMap: () => void;
};

type MapPickerForeignMenuContentProps = {
  variant: "foreign";
  onBackToMyMaps: () => void;
};

export type MapPickerMenuContentProps =
  | MapPickerMemberMenuContentProps
  | MapPickerForeignMenuContentProps;

export function MapPickerMenuContent(props: MapPickerMenuContentProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  if (props.variant === "foreign") {
    return (
      <DropdownMenuItem onClick={() => props.onBackToMyMaps()}>
        Back to my maps
      </DropdownMenuItem>
    );
  }

  const { maps, activeMapId, onOpenMapSettings, onNewMap } = props;

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>Maps</DropdownMenuLabel>
        {maps.map((j) => {
          const selected = j.id === activeMapId;
          return (
            <DropdownMenuEditRow key={j.id}>
              <DropdownMenuCheckItem
                onClick={() => {
                  navigate(mapSwitchHref(j, pathname, search));
                }}
              >
                <DropdownMenuItemEmoji>{mapEmoji(j)}</DropdownMenuItemEmoji>
                <DropdownMenuItemName selected={selected}>
                  {j.name}
                </DropdownMenuItemName>
                {selected ? (
                  <DropdownMenuCheckIcon>
                    <Check aria-hidden />
                  </DropdownMenuCheckIcon>
                ) : (
                  <DropdownMenuCheckSpacer />
                )}
              </DropdownMenuCheckItem>
              {selected ? (
                <DropdownMenuEditButton
                  title="Map settings"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenMapSettings(mapRouteForMap(j));
                  }}
                >
                  <Settings aria-hidden />
                </DropdownMenuEditButton>
              ) : null}
            </DropdownMenuEditRow>
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
