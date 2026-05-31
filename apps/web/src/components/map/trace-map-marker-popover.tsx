import { FloatingPanel } from "@/components/layout/floating-panel";
import type { TraceMapHandle } from "@/components/map/trace-map";
import { useMaxSm } from "@/hooks/use-max-sm";
import { traceDetailHref } from "@/lib/app-paths";
import { mapAnchorPanelMiddleware } from "@/lib/map-anchor-floating-ui";
import { supabase } from "@/lib/supabase";
import { formatTraceDateRange } from "@/lib/trace-dates";
import { photosToLightboxItems } from "@/lib/trace-photo-lightbox-items";
import type { TraceWithTags } from "@/lib/trace-with-tags";
import { useTracePhotosSignedUrls } from "@/lib/use-trace-photos";
import { contrastingForeground } from "@curolia/ui";
import { Button } from "@curolia/ui/button";
import { MapFloatingAnchor, MapFloatingPanel } from "@curolia/ui/map-floating";
import {
  MapMarkerPopoverActions,
  MapMarkerPopoverBody,
  MapMarkerPopoverDescription,
  MapMarkerPopoverHeader,
  MapMarkerPopoverHeaderActions,
  MapMarkerPopoverPhotoSkeleton,
  MapMarkerPopoverPhotoStrip,
  MapMarkerPopoverSheetBody,
  MapMarkerPopoverSheetContent,
  MapMarkerPopoverSheetTitle,
  MapMarkerPopoverStatus,
  MapMarkerPopoverTagRow,
} from "@curolia/ui/map-marker-popover";
import { Sheet } from "@curolia/ui/sheet";
import { TraceDetailTagBadge } from "@curolia/ui/trace-detail";
import {
  TracePhotoLightbox,
  TracePhotoThumb,
} from "@curolia/ui/trace-photo-lightbox";
import { autoUpdate, computePosition } from "@floating-ui/dom";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";

type TracePopoverRow = TraceWithTags;

type TraceMapMarkerPopoverProps = {
  traceId: string;
  journalId: string | null;
  /** Journal URL segment for `/traces/:journalSlug/:traceSlug`. */
  journalSlug: string | null;
  mapRef: RefObject<TraceMapHandle | null>;
  /** Marker position from map list detail (immediate); avoids fixed-panel flash before trace query resolves. */
  listAnchorLngLat?: { lat: number; lng: number } | null;
  onClose: () => void;
};

function validLngLat(
  lat: unknown,
  lng: unknown,
): { lat: number; lng: number } | null {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  )
    return null;
  return { lat, lng };
}

export function TraceMapMarkerPopover({
  traceId,
  journalId,
  journalSlug,
  mapRef,
  listAnchorLngLat = null,
  onClose,
}: TraceMapMarkerPopoverProps) {
  const isMobile = useMaxSm();
  const floatingRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [photoLightbox, setPhotoLightbox] = useState<{
    photoId: string;
  } | null>(null);
  /** Desktop floating: hide until first computePosition applies (avoids 0,0 / flow flash). */
  const [placementReady, setPlacementReady] = useState(false);

  const virtualReference = useMemo(
    () => ({
      getBoundingClientRect() {
        const a = anchorRef.current;
        return new DOMRect(a.x, a.y, 0, 0);
      },
    }),
    [],
  );

  const traceQuery = useQuery({
    queryKey: ["trace", traceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traces")
        .select(
          `*,
          trace_tags ( tag_id, tags ( id, name, color, icon_emoji ) )`,
        )
        .eq("id", traceId)
        .maybeSingle();
      if (error) throw error;
      return data as TracePopoverRow | null;
    },
    enabled: Boolean(traceId),
  });

  const trace = traceQuery.data;
  const { photos, signedUrlByPhotoId } = useTracePhotosSignedUrls(traceId);
  const wrongJournal = trace && journalId && trace.journal_id !== journalId;

  const anchorCoords = useMemo(() => {
    const fromRow = trace ? validLngLat(trace.lat, trace.lng) : null;
    if (fromRow) return fromRow;
    return listAnchorLngLat
      ? validLngLat(listAnchorLngLat.lat, listAnchorLngLat.lng)
      : null;
  }, [trace, listAnchorLngLat]);

  const lightboxItems = useMemo(
    () => photosToLightboxItems(photos, signedUrlByPhotoId),
    [photos, signedUrlByPhotoId],
  );

  const tagBadges = useMemo(() => {
    const rows = trace?.trace_tags ?? [];
    return rows.map((tt) => tt.tags).filter(Boolean) as {
      id: string;
      name: string;
      color: string;
      icon_emoji: string;
    }[];
  }, [trace]);

  useLayoutEffect(() => {
    if (isMobile || !anchorCoords) return;
    const floating = floatingRef.current;
    if (!floating) return;

    let cancelled = false;
    let pulseRaf = 0;
    let pulseCount = 0;

    const latestScreenAnchor = (): { x: number; y: number } | null => {
      return (
        mapRef.current?.lngLatToScreen(anchorCoords.lng, anchorCoords.lat) ??
        null
      );
    };

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
  }, [isMobile, anchorCoords, virtualReference, traceId, mapRef]);

  const titleText = traceQuery.isLoading
    ? "Loading…"
    : trace?.title || "Untitled place";

  const traceDateSubtitle =
    trace && !wrongJournal
      ? formatTraceDateRange(trace.date, trace.end_date)
      : "";

  const detailHref =
    journalSlug?.trim() && trace
      ? traceDetailHref(journalSlug.trim(), trace.slug)
      : "#";

  const body = (
    <MapMarkerPopoverBody>
      <MapMarkerPopoverHeader
        title={titleText}
        actions={
          <MapMarkerPopoverHeaderActions>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close"
            >
              <X />
            </Button>
          </MapMarkerPopoverHeaderActions>
        }
      />

      {traceQuery.isLoading ? (
        <MapMarkerPopoverStatus>Fetching trace…</MapMarkerPopoverStatus>
      ) : !trace || wrongJournal ? (
        <MapMarkerPopoverStatus>
          Trace not found or not in this journal.
        </MapMarkerPopoverStatus>
      ) : (
        <>
          {traceDateSubtitle ? (
            <MapMarkerPopoverStatus>{traceDateSubtitle}</MapMarkerPopoverStatus>
          ) : null}
          {tagBadges.length > 0 ? (
            <MapMarkerPopoverTagRow>
              {tagBadges.map((t) => (
                <TraceDetailTagBadge
                  key={t.id}
                  style={{
                    backgroundColor: t.color,
                    color: contrastingForeground(t.color),
                  }}
                >
                  {t.icon_emoji} {t.name}
                </TraceDetailTagBadge>
              ))}
            </MapMarkerPopoverTagRow>
          ) : null}
          {trace.description ? (
            <MapMarkerPopoverDescription>
              {trace.description}
            </MapMarkerPopoverDescription>
          ) : null}
          {photos.length > 0 ? (
            <MapMarkerPopoverPhotoStrip>
              {photos.map((p) => {
                const url = signedUrlByPhotoId[p.id];
                return url ? (
                  <TracePhotoThumb
                    key={p.id}
                    url={url}
                    size="lg"
                    onOpen={() => setPhotoLightbox({ photoId: p.id })}
                  />
                ) : (
                  <MapMarkerPopoverPhotoSkeleton key={p.id} />
                );
              })}
            </MapMarkerPopoverPhotoStrip>
          ) : null}
          <MapMarkerPopoverActions>
            <Button
              variant="secondary"
              size="lg"
              render={
                <Link
                  to={detailHref}
                  onClick={(e) => {
                    if (detailHref === "#") e.preventDefault();
                  }}
                />
              }
            >
              View trace
            </Button>
          </MapMarkerPopoverActions>
          <TracePhotoLightbox
            open={photoLightbox !== null}
            onOpenChange={(o) => {
              if (!o) setPhotoLightbox(null);
            }}
            items={lightboxItems}
            initialPhotoId={photoLightbox?.photoId ?? null}
            title={trace.title?.trim() || "Untitled place"}
          />
        </>
      )}
    </MapMarkerPopoverBody>
  );

  const desktopFallback = !isMobile && !anchorCoords;

  if (isMobile) {
    return (
      <Sheet
        open
        modal={false}
        disablePointerDismissal
        onOpenChange={(o) => !o && onClose()}
      >
        <MapMarkerPopoverSheetContent>
          <MapMarkerPopoverSheetTitle>{titleText}</MapMarkerPopoverSheetTitle>
          <MapMarkerPopoverSheetBody>{body}</MapMarkerPopoverSheetBody>
        </MapMarkerPopoverSheetContent>
      </Sheet>
    );
  }

  if (!anchorCoords && traceQuery.isPending) {
    return null;
  }

  return (
    <>
      {!desktopFallback ? (
        <MapFloatingAnchor ready={placementReady} hostRef={floatingRef}>
          <MapFloatingPanel anchored>
            <FloatingPanel>{body}</FloatingPanel>
          </MapFloatingPanel>
        </MapFloatingAnchor>
      ) : (
        <MapFloatingPanel fallback>
          <FloatingPanel>{body}</FloatingPanel>
        </MapFloatingPanel>
      )}
    </>
  );
}
