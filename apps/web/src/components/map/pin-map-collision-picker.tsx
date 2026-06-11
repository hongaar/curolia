import { FloatingPanel } from "@/components/layout/floating-panel";
import type { PinMapHandle } from "@/components/map/pin-map";
import styles from "@/components/map/pin-map-collision-picker.module.css";
import { useMaxSm } from "@/hooks/use-max-sm";
import { mapAnchorPanelMiddleware } from "@/lib/map-anchor-floating-ui";
import { formatPinDateRange } from "@/lib/pin-dates";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { pinLocationLabel } from "@curolia/services/geocoding";
import { Button } from "@curolia/ui/button";
import { MapFloatingAnchor, MapFloatingPanel } from "@curolia/ui/map-floating";
import { MapMarker } from "@curolia/ui/map-marker";
import {
  MapMarkerPopoverSheetContent,
  MapMarkerPopoverSheetTitle,
} from "@curolia/ui/map-marker-popover";
import {
  SearchResultBody,
  SearchResultRow,
  SearchResultSubtitle,
  SearchResultTitle,
  SearchResultTitleRow,
} from "@curolia/ui/search";
import { Sheet } from "@curolia/ui/sheet";
import { autoUpdate, computePosition } from "@floating-ui/dom";
import { X } from "lucide-react";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type WheelEvent,
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

export function PinMapCollisionPicker({
  state,
  pins,
  mapRef,
  onSelectPin,
  onClose,
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

  const onListWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const list = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = list;
    const delta = event.deltaY;
    const canScrollUp = scrollTop > 0;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
    if ((delta < 0 && canScrollUp) || (delta > 0 && canScrollDown)) {
      event.preventDefault();
    }
  }, []);

  const content = (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </Button>
      </div>
      <div
        className={styles.list}
        role="listbox"
        aria-label={title}
        onWheel={onListWheel}
      >
        {orderedPins.map((pin) => {
          const { emoji, fill } = pinMarkerVisual(pin);
          const subtitle = pinPickerSubtitle(pin);
          return (
            <SearchResultRow key={pin.id} onClick={() => onSelectPin(pin.id)}>
              <span className={styles.rowMarker}>
                <MapMarker emoji={emoji} fill={fill} size="sm" />
              </span>
              <SearchResultBody>
                <SearchResultTitleRow>
                  <SearchResultTitle>{pinDisplayTitle(pin)}</SearchResultTitle>
                </SearchResultTitleRow>
                {subtitle ? (
                  <SearchResultSubtitle>{subtitle}</SearchResultSubtitle>
                ) : null}
              </SearchResultBody>
            </SearchResultRow>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet
        open
        modal={false}
        disablePointerDismissal
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <MapMarkerPopoverSheetContent>
          <MapMarkerPopoverSheetTitle>{title}</MapMarkerPopoverSheetTitle>
          <div className={styles.sheetBody}>{content}</div>
        </MapMarkerPopoverSheetContent>
      </Sheet>
    );
  }

  return (
    <MapFloatingAnchor ready={placementReady} hostRef={floatingRef}>
      <MapFloatingPanel anchored>
        <FloatingPanel padding="none" className={styles.panel}>
          {content}
        </FloatingPanel>
      </MapFloatingPanel>
    </MapFloatingAnchor>
  );
}
