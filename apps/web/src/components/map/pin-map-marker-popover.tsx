import { FloatingPanel } from "@/components/layout/floating-panel";
import type { PinMapHandle } from "@/components/map/pin-map";
import { useMaxSm } from "@/hooks/use-max-sm";
import { pinDetailHref } from "@/lib/app-paths";
import { mapAnchorPanelMiddleware } from "@/lib/map-anchor-floating-ui";
import { buildPinSubtitleRows } from "@/lib/pin-detail-subtitle";
import { pinLocationLabel } from "@/lib/pin-geocode";
import { photosToLightboxItems } from "@/lib/pin-photo-lightbox-items";
import type { PinWithTags } from "@/lib/pin-with-tags";
import { supabase } from "@/lib/supabase";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { usePinMetadataSubtitle } from "@/lib/use-pin-metadata-subtitle";
import { usePinPhotosSignedUrls } from "@/lib/use-pin-photos";
import {
  OPEN_METEO_PLUGIN_ID,
  OpenMeteoPinWeatherSubtitle,
  useOpenMeteoPinSubtitle,
} from "@curolia/plugin-open-meteo";
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
  MapMarkerPopoverStatusStack,
  MapMarkerPopoverTagRow,
} from "@curolia/ui/map-marker-popover";
import { PinDetailTagBadge } from "@curolia/ui/pin-detail";
import { PinMetadataSubtitleContent } from "@curolia/ui/pin-metadata-subtitle";
import {
  PinPhotoLightbox,
  PinPhotoThumb,
} from "@curolia/ui/pin-photo-lightbox";
import { Sheet } from "@curolia/ui/sheet";
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

type PinPopoverRow = PinWithTags;

type PinMapMarkerPopoverProps = {
  pinId: string;
  mapId: string | null;
  /** Map URL segment for `/pins/:mapSlug/:pinSlug`. */
  mapSlug: string | null;
  mapRef: RefObject<PinMapHandle | null>;
  /** Marker position from map list detail (immediate); avoids fixed-panel flash before pin query resolves. */
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

export function PinMapMarkerPopover({
  pinId,
  mapId,
  mapSlug,
  mapRef,
  listAnchorLngLat = null,
  onClose,
}: PinMapMarkerPopoverProps) {
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

  const pinQuery = useQuery({
    queryKey: ["pin", pinId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pins")
        .select(
          `*,
          pin_tags ( tag_id, tags ( id, name, color, icon_emoji ) )`,
        )
        .eq("id", pinId)
        .maybeSingle();
      if (error) throw error;
      return data as PinPopoverRow | null;
    },
    enabled: Boolean(pinId),
  });

  const pin = pinQuery.data;
  const { plugins: enabledPlugins } = useEnabledPlugins();
  const { photos, signedUrlByPhotoId } = usePinPhotosSignedUrls(pinId);
  const wrongMap = pin && mapId && pin.map_id !== mapId;

  const openMeteoGloballyEnabled = enabledPlugins.some(
    (p) => p.id === OPEN_METEO_PLUGIN_ID,
  );
  const weatherSubtitle = useOpenMeteoPinSubtitle({
    supabase,
    pinId: pin?.id ?? pinId,
    mapId: pin?.map_id ?? mapId ?? "",
    lat: pin?.lat ?? 0,
    lng: pin?.lng ?? 0,
    pinDate: pin?.date,
    pinEndDate: pin?.end_date,
    queryEnabled:
      openMeteoGloballyEnabled &&
      Boolean(pin?.id ?? pinId) &&
      Boolean(pin?.map_id ?? mapId),
  });
  const metadataSubtitle = usePinMetadataSubtitle({
    pinId: pin?.id ?? pinId,
    mapId: pin?.map_id ?? mapId,
  });

  const anchorCoords = useMemo(() => {
    const fromRow = pin ? validLngLat(pin.lat, pin.lng) : null;
    if (fromRow) return fromRow;
    return listAnchorLngLat
      ? validLngLat(listAnchorLngLat.lat, listAnchorLngLat.lng)
      : null;
  }, [pin, listAnchorLngLat]);

  const lightboxItems = useMemo(
    () => photosToLightboxItems(photos, signedUrlByPhotoId),
    [photos, signedUrlByPhotoId],
  );

  const tagBadges = useMemo(() => {
    const rows = pin?.pin_tags ?? [];
    return rows.map((tt) => tt.tags).filter(Boolean) as {
      id: string;
      name: string;
      color: string;
      icon_emoji: string;
    }[];
  }, [pin]);

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
  }, [isMobile, anchorCoords, virtualReference, pinId, mapRef]);

  const titleText = pinQuery.isLoading
    ? "Loading…"
    : pin?.title || "Untitled place";

  const pinSubtitleRows =
    pin && !wrongMap
      ? buildPinSubtitleRows({
          date: pin.date,
          endDate: pin.end_date,
          locationLabel: pinLocationLabel(pin),
          weather: weatherSubtitle ? (
            <OpenMeteoPinWeatherSubtitle subtitle={weatherSubtitle} />
          ) : null,
          enrichment: metadataSubtitle ? (
            <PinMetadataSubtitleContent subtitle={metadataSubtitle} />
          ) : null,
        })
      : [];

  const detailHref =
    mapSlug?.trim() && pin ? pinDetailHref(mapSlug.trim(), pin.slug) : "#";

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

      {pinQuery.isLoading ? (
        <MapMarkerPopoverStatus>Fetching pin…</MapMarkerPopoverStatus>
      ) : !pin || wrongMap ? (
        <MapMarkerPopoverStatus>
          Pin not found or not in this map.
        </MapMarkerPopoverStatus>
      ) : (
        <>
          {pinSubtitleRows.length > 0 ? (
            <MapMarkerPopoverStatusStack rows={pinSubtitleRows} />
          ) : null}
          {tagBadges.length > 0 ? (
            <MapMarkerPopoverTagRow>
              {tagBadges.map((t) => (
                <PinDetailTagBadge
                  key={t.id}
                  style={{
                    backgroundColor: t.color,
                    color: contrastingForeground(t.color),
                  }}
                >
                  {t.icon_emoji} {t.name}
                </PinDetailTagBadge>
              ))}
            </MapMarkerPopoverTagRow>
          ) : null}
          {pin.description ? (
            <MapMarkerPopoverDescription markdown={pin.description} />
          ) : null}
          {photos.length > 0 ? (
            <MapMarkerPopoverPhotoStrip>
              {photos.map((p) => {
                const url = signedUrlByPhotoId[p.id];
                return url ? (
                  <PinPhotoThumb
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
              View pin
            </Button>
          </MapMarkerPopoverActions>
          <PinPhotoLightbox
            open={photoLightbox !== null}
            onOpenChange={(o) => {
              if (!o) setPhotoLightbox(null);
            }}
            items={lightboxItems}
            initialPhotoId={photoLightbox?.photoId ?? null}
            title={pin.title?.trim() || "Untitled place"}
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

  if (!anchorCoords && pinQuery.isPending) {
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
