import { mapSwitchHref, type MapWithOwnerSlug } from "@/lib/app-paths";
import { defaultMapIcon } from "@/lib/map-display-icon";
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
  DropdownMenuItemEmoji,
  DropdownMenuItemName,
} from "@curolia/ui/dropdown-menu-list";
import { Check, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function mapEmoji(map: MapWithOwnerSlug) {
  return map.icon_emoji ?? defaultMapIcon();
}

type MapPickerMemberMenuContentProps = {
  variant: "member";
  maps: MapWithOwnerSlug[];
  activeMapId: string | null | undefined;
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

  const { maps, activeMapId, onNewMap } = props;

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>Maps</DropdownMenuLabel>
        {maps.map((j) => {
          const selected = j.id === activeMapId;
          return (
            <DropdownMenuCheckItem
              key={j.id}
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
