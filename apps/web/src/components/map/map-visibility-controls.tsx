import { useMapVisibility } from "@/lib/use-map-visibility";
import type { CuroliaMap } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@curolia/ui/dropdown-menu";
import { ChevronDown, Globe, Lock } from "lucide-react";

export function MapVisibilityMenu({
  map,
  onMapChange,
  disabled = false,
}: {
  map: Pick<CuroliaMap, "id" | "is_public" | "slug">;
  onMapChange?: (isPublic: boolean) => void;
  disabled?: boolean;
}) {
  const { setPublic, publicBusy } = useMapVisibility(map);
  const value = map.is_public ? "public" : "private";
  const VisibilityIcon = map.is_public ? Globe : Lock;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled || publicBusy}
            aria-label="Map visibility"
          />
        }
      >
        <VisibilityIcon aria-hidden size={16} />
        {map.is_public ? "Public" : "Private"}
        <ChevronDown aria-hidden size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => {
              if (next !== "public" && next !== "private") return;
              void setPublic(next === "public", map.is_public).then((ok) => {
                if (ok) onMapChange?.(next === "public");
              });
            }}
          >
            <DropdownMenuRadioItem value="public">Public</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="private">
              Private
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
