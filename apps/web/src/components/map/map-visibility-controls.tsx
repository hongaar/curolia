import { MAP_VISIBILITY_SCHEME } from "@/lib/visibility-schemes";
import { VisibilityMenu } from "@/components/visibility/visibility-controls";
import { useMapVisibility } from "@/lib/use-map-visibility";
import type { Visibility } from "@/lib/visibility";
import type { CuroliaMap } from "@/types/database";

export function MapVisibilityMenu({
  map,
  onMapChange,
  disabled = false,
  silent = false,
}: {
  map: Pick<CuroliaMap, "id" | "visibility" | "slug">;
  onMapChange?: (visibility: Visibility) => void;
  disabled?: boolean;
  /** Skip toast notifications (e.g. quick settings footer feedback). */
  silent?: boolean;
}) {
  const { setVisibility, visibilityBusy } = useMapVisibility(map);

  return (
    <VisibilityMenu
      scheme={MAP_VISIBILITY_SCHEME}
      value={map.visibility}
      disabled={disabled || visibilityBusy}
      ariaLabel="Map visibility"
      onValueChange={(next) => {
        void setVisibility(next, { silent }).then((result) => {
          if (result.ok) onMapChange?.(next);
        });
      }}
    />
  );
}
