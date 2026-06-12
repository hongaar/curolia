import type { PinMapHandle } from "@/components/map/pin-map";
import type { PinMapCollisionPickerState } from "@/components/map/pin-map-collision-picker";
import {
  measureMapPanelInset,
  type MapPanelLayout,
} from "@/lib/map-panel-inset";
import {
  applySelectedPinToSearchParams,
  camerasCloseEnough,
  type MapCamera,
} from "@/lib/map-view-params";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { isStackRoute } from "@/lib/stack-routes";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
} from "react";

type SetSearchParams = (
  next: SetStateAction<URLSearchParams>,
  options?: { replace?: boolean },
) => void;

/** Whether URL-resolved pin id should update bottom-sheet state (not during tap-led race). */
export function shouldAdoptUrlPinForBottomSheet(
  sidebarPinId: string,
  bottomSheetPinId: string | null,
  sheetLeadsUrlPinId: string | null,
): boolean {
  if (sidebarPinId === bottomSheetPinId) return false;
  if (sheetLeadsUrlPinId != null && sheetLeadsUrlPinId === bottomSheetPinId) {
    return false;
  }
  return true;
}

/** Whether to hide the bottom sheet after ?pin= was cleared (not during tap-led open). */
export function shouldCloseBottomSheetWithoutUrlPin(
  sidebarPinToken: string | null,
  bottomSheetOpen: boolean,
  bottomSheetPinId: string | null,
  sheetLeadsUrlPinId: string | null,
): boolean {
  if (sidebarPinToken) return false;
  if (sheetLeadsUrlPinId !== null) return false;
  return bottomSheetOpen || bottomSheetPinId !== null;
}

export type UseMapPinPanelOptions = {
  mapRef: RefObject<PinMapHandle | null>;
  isWideEnough: boolean;
  sidebarPinId: string | null | undefined;
  sidebarPinToken: string | null;
  sidebarPinTokenRef: MutableRefObject<string | null>;
  pins: PinWithTags[];
  pinsLoading: boolean;
  pinsFetching: boolean;
  setSearchParams: SetSearchParams;
  clearCameraIdleTimer: () => void;
  activeMapId: string | null;
};

export function useMapPinPanel({
  mapRef,
  isWideEnough,
  sidebarPinId,
  sidebarPinToken,
  sidebarPinTokenRef,
  pins,
  pinsLoading,
  pinsFetching,
  setSearchParams,
  clearCameraIdleTimer,
  activeMapId,
}: UseMapPinPanelOptions) {
  const layout: MapPanelLayout = isWideEnough ? "side" : "bottom";
  const usesBottomSheet = layout === "bottom";

  const sidePanelRef = useRef<HTMLDivElement>(null);
  const panelPopupRef = useRef<HTMLDivElement>(null);
  const collisionPopupRef = useRef<HTMLDivElement>(null);
  const bottomSheetDismissRef = useRef<(() => void) | null>(null);

  const prevPanelPinIdRef = useRef<string | null>(null);
  const prevCameraBeforePanelRef = useRef<MapCamera | null>(null);
  const postPanCameraBeforePanelRef = useRef<MapCamera | null>(null);
  const panelCameraRestoredRef = useRef(false);
  const prevCollisionPickerRef = useRef<PinMapCollisionPickerState | null>(
    null,
  );
  const collisionPinPickRef = useRef(false);
  const panCommittedPinIdRef = useRef<string | null>(null);
  const collisionPanCommittedRef = useRef(false);
  /** Blocks URL-driven bottom sheet reopen until the user selects a pin again. */
  const userDismissedRef = useRef(false);
  /** Tap-selected pin while ?pin= is still catching up — blocks URL sync from reverting sheet. */
  const sheetLeadsUrlPinIdRef = useRef<string | null>(null);

  const [sidePanelAnimateIn, setSidePanelAnimateIn] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [bottomSheetPinId, setBottomSheetPinId] = useState<string | null>(null);

  const panelPinId = isWideEnough ? (sidebarPinId ?? null) : bottomSheetPinId;
  const mapSelectedPinId = isWideEnough
    ? sidebarPinId
    : (bottomSheetPinId ?? sidebarPinId);

  const showSidePanel = Boolean(sidebarPinId && isWideEnough);

  const panelMeasureRef = usesBottomSheet ? panelPopupRef : sidePanelRef;

  const restoreCameraAfterPanelClose = useCallback(
    (options?: { respectUrlPin?: boolean }) => {
      if (panelCameraRestoredRef.current) return;
      if (options?.respectUrlPin && sidebarPinTokenRef.current) return;

      const prevCamera = prevCameraBeforePanelRef.current;
      const postPanCamera = postPanCameraBeforePanelRef.current;
      const currentCamera = mapRef.current?.getCurrentCamera() ?? null;
      const userAdjustedCamera =
        postPanCamera != null &&
        currentCamera != null &&
        !camerasCloseEnough(currentCamera, postPanCamera);

      if (userAdjustedCamera) {
        mapRef.current?.clearPanelPadding();
      } else if (prevCamera) {
        mapRef.current?.restoreCameraAfterPanel(prevCamera);
      }
      panelCameraRestoredRef.current = true;
      prevCameraBeforePanelRef.current = null;
      postPanCameraBeforePanelRef.current = null;
    },
    [mapRef, sidebarPinTokenRef],
  );

  const panPanelAtMarker = useCallback(
    (
      lng: number,
      lat: number,
      measureRef: RefObject<HTMLElement | null>,
      options?: { captureCamera?: boolean },
    ) => {
      if (options?.captureCamera !== false) {
        panelCameraRestoredRef.current = false;
        prevCameraBeforePanelRef.current =
          mapRef.current?.getCurrentCamera() ?? null;
        postPanCameraBeforePanelRef.current = null;
      }
      const inset = measureMapPanelInset(layout, measureRef.current);
      mapRef.current?.panForPanel(lng, lat, inset, () => {
        postPanCameraBeforePanelRef.current =
          mapRef.current?.getCurrentCamera() ?? null;
      });
    },
    [layout, mapRef],
  );

  const panWhenBottomSheetReady = useCallback(
    (
      lng: number,
      lat: number,
      measureRef: RefObject<HTMLElement | null>,
      options?: { captureCamera?: boolean },
    ) => {
      const execute = () => {
        panPanelAtMarker(lng, lat, measureRef, options);
      };
      if (layout !== "bottom") {
        execute();
        return;
      }
      const height = measureRef.current?.getBoundingClientRect().height ?? 0;
      if (height >= 48) {
        execute();
        return;
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(execute);
      });
    },
    [layout, panPanelAtMarker],
  );

  /* eslint-disable react-hooks/set-state-in-effect -- sync URL ?pin= to mobile bottom sheet when not user-dismissed */
  useEffect(() => {
    if (!usesBottomSheet) return;
    if (userDismissedRef.current) return;

    if (sidebarPinToken && sidebarPinId) {
      if (sidebarPinId === bottomSheetPinId) {
        sheetLeadsUrlPinIdRef.current = null;
      } else if (
        shouldAdoptUrlPinForBottomSheet(
          sidebarPinId,
          bottomSheetPinId,
          sheetLeadsUrlPinIdRef.current,
        )
      ) {
        setBottomSheetPinId(sidebarPinId);
      }
      if (!bottomSheetOpen) {
        setBottomSheetOpen(true);
      }
      return;
    }

    if (
      shouldCloseBottomSheetWithoutUrlPin(
        sidebarPinToken,
        bottomSheetOpen,
        bottomSheetPinId,
        sheetLeadsUrlPinIdRef.current,
      )
    ) {
      setBottomSheetOpen(false);
      setBottomSheetPinId(null);
    }
  }, [
    usesBottomSheet,
    sidebarPinToken,
    sidebarPinId,
    bottomSheetPinId,
    bottomSheetOpen,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /** Bottom sheet is portaled above stack layers — hide it when a stack screen opens. */
  /* eslint-disable react-hooks/set-state-in-effect -- close overlay when pathname is a stack route */
  useLayoutEffect(() => {
    if (!usesBottomSheet) return;
    if (typeof window === "undefined") return;
    if (!isStackRoute(window.location.pathname)) return;
    if (!bottomSheetOpen && !bottomSheetPinId) return;
    setBottomSheetOpen(false);
    setBottomSheetPinId(null);
    sheetLeadsUrlPinIdRef.current = null;
  }, [usesBottomSheet, bottomSheetOpen, bottomSheetPinId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const beginPanelDismiss = useCallback(() => {
    userDismissedRef.current = true;
    clearCameraIdleTimer();
    sidebarPinTokenRef.current = null;
    setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
      replace: true,
    });
    restoreCameraAfterPanelClose();
  }, [
    clearCameraIdleTimer,
    restoreCameraAfterPanelClose,
    setSearchParams,
    sidebarPinTokenRef,
  ]);

  const hideBottomSheetOverlay = useCallback(() => {
    setBottomSheetOpen(false);
    setBottomSheetPinId(null);
    sheetLeadsUrlPinIdRef.current = null;
  }, []);

  const finishPanelClose = useCallback(() => {
    if (
      usesBottomSheet &&
      typeof window !== "undefined" &&
      isStackRoute(window.location.pathname)
    ) {
      hideBottomSheetOverlay();
      return;
    }
    if (usesBottomSheet) {
      beginPanelDismiss();
    } else {
      clearCameraIdleTimer();
      sidebarPinTokenRef.current = null;
      setSearchParams((prev) => applySelectedPinToSearchParams(prev, null), {
        replace: true,
      });
    }
    setBottomSheetOpen(false);
    setBottomSheetPinId(null);
    sheetLeadsUrlPinIdRef.current = null;
    setSidePanelAnimateIn(false);
    mapRef.current?.invalidatePendingMarkerSelection();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [
    usesBottomSheet,
    beginPanelDismiss,
    clearCameraIdleTimer,
    hideBottomSheetOverlay,
    mapRef,
    setSearchParams,
    sidebarPinTokenRef,
  ]);

  const onCollisionDismissStart = useCallback(() => {
    restoreCameraAfterPanelClose();
  }, [restoreCameraAfterPanelClose]);

  const onCollisionOpen = useCallback(
    (lng: number, lat: number) => {
      if (!usesBottomSheet) return;
      collisionPanCommittedRef.current = true;
      panPanelAtMarker(lng, lat, collisionPopupRef);
    },
    [usesBottomSheet, panPanelAtMarker],
  );

  const onCollisionClose = useCallback(() => {
    if (usesBottomSheet) {
      restoreCameraAfterPanelClose();
    }
    mapRef.current?.invalidatePendingMarkerSelection();
  }, [usesBottomSheet, restoreCameraAfterPanelClose, mapRef]);

  const onPinSelectFromMap = useCallback(
    (
      id: string,
      row: PinWithTags | undefined,
      options?: { captureCamera?: boolean },
    ) => {
      setSidePanelAnimateIn(true);
      if (usesBottomSheet) {
        userDismissedRef.current = false;
        sheetLeadsUrlPinIdRef.current = id;
        setBottomSheetPinId(id);
        setBottomSheetOpen(true);
        if (row && typeof row.lat === "number" && typeof row.lng === "number") {
          const openingFreshPanel =
            !bottomSheetOpen || bottomSheetPinId === null;
          // Fresh open: layout effect pans after sheet mounts (measured inset).
          // Switch: immediate pan so marker centering starts with the tap.
          if (!openingFreshPanel) {
            panCommittedPinIdRef.current = id;
            panWhenBottomSheetReady(row.lng, row.lat, panelPopupRef, {
              captureCamera:
                options?.captureCamera ?? !collisionPinPickRef.current,
            });
          }
        }
      }
    },
    [
      usesBottomSheet,
      bottomSheetOpen,
      bottomSheetPinId,
      panWhenBottomSheetReady,
    ],
  );

  const onCollisionPinPick = useCallback(() => {
    collisionPinPickRef.current = true;
  }, []);

  const pinsRef = useRef(pins);
  useLayoutEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  useLayoutEffect(() => {
    prevPanelPinIdRef.current = null;
    prevCollisionPickerRef.current = null;
    collisionPinPickRef.current = false;
    userDismissedRef.current = false;
    sheetLeadsUrlPinIdRef.current = null;
    panelCameraRestoredRef.current = false;
    panCommittedPinIdRef.current = null;
    collisionPanCommittedRef.current = false;
    prevCameraBeforePanelRef.current = null;
    postPanCameraBeforePanelRef.current = null;
  }, [activeMapId, isWideEnough]);

  const syncCollisionPanelCamera = useCallback(
    (picker: PinMapCollisionPickerState | null) => {
      if (!usesBottomSheet) {
        prevCollisionPickerRef.current = picker;
        return;
      }

      const prev = prevCollisionPickerRef.current;
      const curr = picker;

      if (curr && !prev) {
        if (!collisionPanCommittedRef.current) {
          panPanelAtMarker(curr.lng, curr.lat, collisionPopupRef);
        } else {
          collisionPanCommittedRef.current = false;
        }
      } else if (!curr && prev) {
        if (collisionPinPickRef.current) {
          collisionPinPickRef.current = false;
        } else if (!panelCameraRestoredRef.current) {
          restoreCameraAfterPanelClose({ respectUrlPin: true });
        }
      }

      prevCollisionPickerRef.current = curr;
    },
    [usesBottomSheet, panPanelAtMarker, restoreCameraAfterPanelClose],
  );

  useLayoutEffect(() => {
    const prevId = prevPanelPinIdRef.current;
    const currId = panelPinId;

    if (!currId && sidebarPinToken && (pinsLoading || pinsFetching)) {
      return;
    }

    if (!currId && prevId && sidebarPinToken) {
      return;
    }

    prevPanelPinIdRef.current = currId;

    const panOpenPin = (pinId: string) => {
      if (usesBottomSheet && panCommittedPinIdRef.current === pinId) {
        panCommittedPinIdRef.current = null;
        return;
      }

      const pin = pinsRef.current.find((p) => p.id === pinId);
      if (pin && typeof pin.lat === "number" && typeof pin.lng === "number") {
        panWhenBottomSheetReady(pin.lng, pin.lat, panelMeasureRef, {
          captureCamera: false,
        });
      } else {
        postPanCameraBeforePanelRef.current = prevCameraBeforePanelRef.current;
      }
    };

    if (currId && !prevId) {
      if (collisionPinPickRef.current) {
        collisionPinPickRef.current = false;
        panelCameraRestoredRef.current = false;
      } else if (!panCommittedPinIdRef.current) {
        panelCameraRestoredRef.current = false;
        prevCameraBeforePanelRef.current =
          mapRef.current?.getCurrentCamera() ?? null;
      }
      postPanCameraBeforePanelRef.current = null;
      panOpenPin(currId);
    } else if (currId && prevId && currId !== prevId) {
      panOpenPin(currId);
    } else if (!currId && prevId) {
      if (panelCameraRestoredRef.current) {
        panelCameraRestoredRef.current = false;
      } else {
        restoreCameraAfterPanelClose({ respectUrlPin: true });
      }
    }
  }, [
    panelPinId,
    sidebarPinToken,
    pinsLoading,
    pinsFetching,
    usesBottomSheet,
    layout,
    panWhenBottomSheetReady,
    panelMeasureRef,
    restoreCameraAfterPanelClose,
    mapRef,
  ]);

  return {
    layout,
    panelPinId,
    mapSelectedPinId,
    showSidePanel,
    sidePanelRef,
    sidePanelAnimateIn,
    setSidePanelAnimateIn,
    panelPopupRef,
    bottomSheetDismissRef,
    bottomSheetOpen,
    bottomSheetPinId,
    setBottomSheetOpen,
    collisionPopupRef,
    userDismissedRef,
    beginPanelDismiss,
    finishPanelClose,
    hideBottomSheetOverlay,
    onCollisionDismissStart,
    onCollisionOpen,
    onCollisionClose,
    onPinSelectFromMap,
    onCollisionPinPick,
    syncCollisionPanelCamera,
  };
}
