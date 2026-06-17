import type { PinMapHandle } from "@/components/map/pin-map";
import {
  BLOG_PANEL_FALLBACK_WIDTH_PX,
  measureMapPanelInset,
} from "@/lib/map-panel-inset";
import type { PinWithTags } from "@/lib/pin-with-tags";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const HOVER_PAN_DEBOUNCE_MS = 180;

type UseMapPanelPinHoverSyncOptions = {
  enabled: boolean;
  sidePanelRef: RefObject<HTMLElement | null>;
  mapRef: RefObject<PinMapHandle | null>;
  pins: PinWithTags[];
  mapId?: string;
  /** When false, defer pan until map fit-to-pins has finished (map switch). */
  mapFitReady?: boolean;
  /** When true, skip panning (e.g. marker hover tooltip open). */
  suspendPanRef?: RefObject<boolean>;
};

/** Pans the map when the user hovers a pin in an embedded map side panel (blog or gallery). */
export function useMapPanelPinHoverSync({
  enabled,
  sidePanelRef,
  mapRef,
  pins,
  mapId,
  mapFitReady = true,
  suspendPanRef,
}: UseMapPanelPinHoverSyncOptions) {
  const [hoverPinId, setHoverPinId] = useState<string | null>(null);
  const [hoverMapId, setHoverMapId] = useState<string | undefined>(mapId);
  const pinsByIdRef = useRef(new Map<string, PinWithTags>());
  const lastPannedPinIdRef = useRef<string | null>(null);
  const panDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPanPinIdRef = useRef<string | null>(null);
  const mapFitReadyRef = useRef(mapFitReady);

  const activeHoverPinId = enabled && hoverMapId === mapId ? hoverPinId : null;

  useEffect(() => {
    mapFitReadyRef.current = mapFitReady;
  }, [mapFitReady]);

  useEffect(() => {
    pinsByIdRef.current = new Map(pins.map((pin) => [pin.id, pin]));
  }, [pins]);

  useEffect(() => {
    lastPannedPinIdRef.current = null;
    pendingPanPinIdRef.current = null;
    if (panDebounceRef.current) {
      clearTimeout(panDebounceRef.current);
      panDebounceRef.current = null;
    }
  }, [mapId]);

  useEffect(() => {
    if (!enabled) {
      lastPannedPinIdRef.current = null;
      pendingPanPinIdRef.current = null;
      if (panDebounceRef.current) {
        clearTimeout(panDebounceRef.current);
        panDebounceRef.current = null;
      }
    }
  }, [enabled]);

  const schedulePan = useCallback(
    (pinId: string) => {
      if (!enabled || !mapFitReadyRef.current) return;
      if (lastPannedPinIdRef.current === pinId) return;
      pendingPanPinIdRef.current = pinId;
      if (panDebounceRef.current) clearTimeout(panDebounceRef.current);
      panDebounceRef.current = setTimeout(() => {
        panDebounceRef.current = null;
        const nextId = pendingPanPinIdRef.current;
        if (!nextId || lastPannedPinIdRef.current === nextId) return;
        if (!mapFitReadyRef.current || suspendPanRef?.current) return;
        const pin = pinsByIdRef.current.get(nextId);
        if (
          !pin ||
          typeof pin.lat !== "number" ||
          typeof pin.lng !== "number"
        ) {
          return;
        }
        lastPannedPinIdRef.current = nextId;
        const inset = measureMapPanelInset("side", sidePanelRef.current);
        mapRef.current?.panForPanel(pin.lng, pin.lat, {
          right: inset.right ?? BLOG_PANEL_FALLBACK_WIDTH_PX,
        });
      }, HOVER_PAN_DEBOUNCE_MS);
    },
    [enabled, sidePanelRef, mapRef, suspendPanRef],
  );

  const onPinHover = useCallback(
    (pinId: string) => {
      if (!enabled) return;
      setHoverMapId(mapId);
      setHoverPinId(pinId);
      schedulePan(pinId);
    },
    [enabled, mapId, schedulePan],
  );

  const onPinHoverEnd = useCallback(() => {
    if (panDebounceRef.current) {
      clearTimeout(panDebounceRef.current);
      panDebounceRef.current = null;
    }
    pendingPanPinIdRef.current = null;
    setHoverPinId(null);
  }, []);

  return {
    hoverPinId: activeHoverPinId,
    onPinHover,
    onPinHoverEnd,
  };
}
