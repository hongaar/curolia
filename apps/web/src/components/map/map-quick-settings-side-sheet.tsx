import { MapQuickSettingsPanel } from "@/components/map/map-quick-settings-panel";
import type { MapRoute } from "@/lib/map-route";
import type { MapStyleOptions, MapStylePreset } from "@/lib/map-style";
import type { CuroliaMap } from "@/types/database";
import { useBottomSheetDismiss } from "@curolia/ui/bottom-sheet";
import { Button } from "@curolia/ui/button";
import {
  PinDetailActions,
  PinDetailHeader,
  PinDetailHeaderMain,
  PinDetailTitle,
} from "@curolia/ui/pin-detail";
import { XIcon } from "lucide-react";

import styles from "./map-quick-settings-side-sheet.module.css";

export function MapQuickSettingsSideSheet({
  map,
  mapRoute,
  onClose,
  onStylePreviewChange,
  bottomSheet = false,
}: {
  map: CuroliaMap;
  mapRoute: MapRoute;
  onClose: () => void;
  onStylePreviewChange?: (style: {
    preset: MapStylePreset;
    options: MapStyleOptions;
  }) => void;
  bottomSheet?: boolean;
}) {
  const dismissBottomSheet = useBottomSheetDismiss();

  const close = () => {
    if (bottomSheet && dismissBottomSheet) {
      dismissBottomSheet();
      return;
    }
    onClose();
  };

  const body = (
    <>
      <PinDetailHeader>
        <PinDetailHeaderMain>
          <PinDetailTitle>Map settings</PinDetailTitle>
          <PinDetailActions>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close map settings"
              onClick={close}
            >
              <XIcon />
            </Button>
          </PinDetailActions>
        </PinDetailHeaderMain>
      </PinDetailHeader>
      <MapQuickSettingsPanel
        map={map}
        mapRoute={mapRoute}
        onClose={close}
        onStylePreviewChange={onStylePreviewChange}
      />
    </>
  );

  if (bottomSheet) {
    return <div className={styles.bottomSheetInner}>{body}</div>;
  }

  return <div className={styles.sideSheetShell}>{body}</div>;
}
