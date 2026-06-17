import { MapQuickSettingsPanel } from "@/components/map/map-quick-settings-panel";
import { useMaxSm } from "@/hooks/use-max-sm";
import type { MapRoute } from "@/lib/map-route";
import type { CuroliaMap } from "@/types/database";
import { BottomSheet } from "@curolia/ui/bottom-sheet";
import { MapToolbar, MapToolbarIconButton } from "@curolia/ui/map-toolbar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@curolia/ui/sheet";
import { Settings } from "lucide-react";
import { useState } from "react";

import styles from "./map-quick-settings-control.module.css";

export function MapQuickSettingsControl({
  map,
  mapRoute,
}: {
  map: CuroliaMap;
  mapRoute: MapRoute;
}) {
  const isMobile = useMaxSm();
  const [open, setOpen] = useState(false);

  const trigger = (
    <MapToolbar>
      <MapToolbarIconButton
        icon={<Settings aria-hidden />}
        label="Map settings"
        title="Map settings"
        active={open}
        onClick={() => setOpen(true)}
      />
    </MapToolbar>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title="Map settings"
          containBody
          partialHeight="min(85dvh, 40rem)"
          overlay="default"
        >
          <MapQuickSettingsPanel
            map={map}
            mapRoute={mapRoute}
            onClose={() => setOpen(false)}
          />
        </BottomSheet>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className={styles.sheetContent}>
          <SheetHeader>
            <SheetTitle>Map settings</SheetTitle>
          </SheetHeader>
          <MapQuickSettingsPanel
            map={map}
            mapRoute={mapRoute}
            onClose={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
