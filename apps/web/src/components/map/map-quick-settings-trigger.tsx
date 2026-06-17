import { MapToolbar, MapToolbarIconButton } from "@curolia/ui/map-toolbar";
import { Settings } from "lucide-react";

export function MapQuickSettingsTrigger({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <MapToolbar>
      <MapToolbarIconButton
        icon={<Settings aria-hidden />}
        label="Map settings"
        title="Map settings"
        active={open}
        onClick={onClick}
      />
    </MapToolbar>
  );
}
