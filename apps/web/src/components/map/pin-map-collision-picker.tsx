import type { PinMapHandle } from "@/components/map/pin-map";
import { useMaxSm } from "@/hooks/use-max-sm";
import { mapAnchorPanelMiddleware } from "@/lib/map-anchor-floating-ui";
import { formatPinDateRange } from "@/lib/pin-dates";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { pinLocationLabel } from "@curolia/services/geocoding";
import { BottomSheet } from "@curolia/ui/bottom-sheet";
import { MapFloatingAnchor, MapFloatingPanel } from "@curolia/ui/map-floating";
import {
  MapMarkerCollisionFloatingPanel,
  MapMarkerCollisionPanel,
  type MapMarkerCollisionItem,
} from "@curolia/ui/map-marker-collision-panel";
import { autoUpdate, computePosition } from "@floating-ui/dom";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

export type PinMapCollisionPickerState = {
  pinIds: string[];
  lng: number;
  lat: number;
};

type PinMapCollisionPickerProps = {
  state: PinMapCollisionPickerState;
  pins: PinWithTags[];
  mapRef: RefObject<PinMapHandle | null>;
  onSelectPin: (id: string) => void;
  onClose: () => void;
  /** Mobile bottom sheet popup — for map inset measurement. */
  popupRef?: RefObject<HTMLDivElement | null>;
  /** Mobile bottom sheet dismiss slide-down start. */
  onDismissStart?: () => void;
};

function pinMarkerVisual(pin: PinWithTags) {
  const tag0 = pin.pin_tags?.[0]?.tags;
  return {
    emoji: tag0?.icon_emoji ?? "📍",
    fill: tag0?.color ?? null,
  };
}

function pinDisplayTitle(pin: PinWithTags): string {
  return pin.title?.trim() || "Untitled place";
}

function pinPickerSubtitle(pin: PinWithTags): string | undefined {
  const parts: string[] = [];
  const date = formatPinDateRange(pin.date, pin.end_date);
  if (date) parts.push(date);
  const place = pinLocationLabel(pin)?.trim();
  if (place) parts.push(place);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function orderCollisionPins(
  pinIds: string[],
  pins: PinWithTags[],
): PinWithTags[] {
  const order = new Map(pins.map((pin, index) => [pin.id, index]));
  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  return [...pinIds]
    .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
    .map((id) => byId.get(id))
    .filter((pin): pin is PinWithTags => Boolean(pin));
}

function toCollisionItems(pins: PinWithTags[]): MapMarkerCollisionItem[] {
  return pins.map((pin) => {
    const { emoji, fill } = pinMarkerVisual(pin);
    return {
      id: pin.id,
      emoji,
      fill,
      title: pinDisplayTitle(pin),
      subtitle: pinPickerSubtitle(pin),
    };
  });
}

export function PinMapCollisionPicker({
  state,
  pins,
  mapRef,
  onSelectPin,
  onClose,
  popupRef,
  onDismissStart,
}: PinMapCollisionPickerProps) {
  const isMobile = useMaxSm();
  const floatingRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [placementReady, setPlacementReady] = useState(false);

  const orderedPins = useMemo(
    () => orderCollisionPins(state.pinIds, pins),
    [state.pinIds, pins],
  );

  const title =
    orderedPins.length === 1 ? "1 pin here" : `${orderedPins.length} pins here`;

  const items = useMemo(() => toCollisionItems(orderedPins), [orderedPins]);

  const virtualReference = useMemo(
    () => ({
      getBoundingClientRect() {
        const a = anchorRef.current;
        return new DOMRect(a.x, a.y, 0, 0);
      },
    }),
    [],
  );

  useLayoutEffect(() => {
    if (isMobile) return;
    const floating = floatingRef.current;
    if (!floating) return;

    let cancelled = false;
    let pulseRaf = 0;
    let pulseCount = 0;

    const latestScreenAnchor = (): { x: number; y: number } | null =>
      mapRef.current?.lngLatToScreen(state.lng, state.lat) ?? null;

    const run = () => {
      if (cancelled) return;
      const p = latestScreenAnchor();
      if (!p) {
        floating.style.removeProperty("left");
        floating.style.removeProperty("top");
        floating.style.removeProperty("right");
        floating.style.removeProperty("bottom");
        floating.style.removeProperty("position");
        setPlacementReady(false);
        return;
      }

      anchorRef.current = { x: p.x, y: p.y };

      void computePosition(virtualReference, floating, {
        placement: "right",
        strategy: "fixed",
        middleware: mapAnchorPanelMiddleware(),
      }).then((data) => {
        if (cancelled) return;
        const host = floatingRef.current;
        if (!host) return;
        const verify = latestScreenAnchor();
        if (!verify) {
          setPlacementReady(false);
          return;
        }
        anchorRef.current = { x: verify.x, y: verify.y };

        Object.assign(host.style, {
          position: "fixed",
          left: `${data.x}px`,
          top: `${data.y}px`,
          right: "auto",
          bottom: "auto",
        });
        setPlacementReady(true);
      });
    };

    run();

    const pulse = () => {
      run();
      pulseCount += 1;
      if (!cancelled && pulseCount < 30) {
        pulseRaf = requestAnimationFrame(pulse);
      }
    };
    pulseRaf = requestAnimationFrame(pulse);

    const unsub = mapRef.current?.subscribeCamera(run) ?? (() => {});

    const onResize = () => run();
    window.addEventListener("resize", onResize);

    const stopAu = autoUpdate(
      virtualReference,
      floating,
      () => {
        run();
      },
      {
        animationFrame: true,
        layoutShift: true,
      },
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(pulseRaf);
      unsub();
      window.removeEventListener("resize", onResize);
      stopAu();
    };
  }, [isMobile, state.lng, state.lat, virtualReference, mapRef]);

  const panelProps = {
    title,
    items,
    onSelectItem: onSelectPin,
    onClose,
  };

  if (isMobile) {
    return (
      <BottomSheet
        open
        title={title}
        overlay="none"
        modal={false}
        containBody
        syncHistoryBack={false}
        popupRef={popupRef}
        onDismissStart={onDismissStart}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <MapMarkerCollisionPanel {...panelProps} sheet />
      </BottomSheet>
    );
  }

  return (
    <MapFloatingAnchor ready={placementReady} hostRef={floatingRef}>
      <MapFloatingPanel anchored>
        <MapMarkerCollisionFloatingPanel {...panelProps} />
      </MapFloatingPanel>
    </MapFloatingAnchor>
  );
}
