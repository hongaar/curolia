import { PageBackButton } from "@/components/layout/page-back-button";
import { PinDetailBody, type PinRow } from "@/components/pins/pin-detail-body";
import { PinDetailInsetMapView } from "@/components/pins/pin-detail-inset-map";
import { useMinMd } from "@/hooks/use-min-md";
import { mapHrefWithSearch, mapViewHref, pinDetailHref } from "@/lib/app-paths";
import { canNavigateBack } from "@/lib/can-navigate-back";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { mapRouteForMap } from "@/lib/map-route";
import {
  normalizeMapStyleOptions,
  normalizeMapStylePreset,
} from "@/lib/map-style";
import {
  applyMapCameraToSearchParams,
  applySelectedPinToSearchParams,
  normalizeCameraForUrl,
  PIN_FOCUS_ZOOM,
} from "@/lib/map-view-params";
import { resolvePinByMapSlug } from "@/lib/resolve-pin-slug";
import { supabase } from "@/lib/supabase";
import { usePinPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useMap } from "@/providers/map-provider";
import { Button } from "@curolia/ui/button";
import { MapNavButton } from "@curolia/ui/map-picker";
import {
  AppPageLayout,
  PageCenteredError,
  PageCenteredLoading,
  PagePanel,
} from "@curolia/ui/page";
import { PageBackButton as UiPageBackButton } from "@curolia/ui/page-back-button";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function PinDetailPageNav({
  mapHref,
  mapName,
  mapEmoji,
}: {
  mapHref: string | null;
  mapName: string;
  mapEmoji: string;
}) {
  const navigate = useNavigate();
  const isWideEnough = useMinMd();
  useLocation();

  if (canNavigateBack()) {
    return <PageBackButton />;
  }

  if (!mapHref) return null;

  if (!isWideEnough) {
    return (
      <MapNavButton
        mapEmoji={mapEmoji}
        mapName={mapName}
        onClick={() => navigate(mapHref)}
      />
    );
  }

  return (
    <UiPageBackButton
      label="Go to map"
      direction="forward"
      onClick={() => navigate(mapHref)}
    />
  );
}

export function PinDetailPage() {
  const { profileSlug, mapSlug, pinSlug } = useParams<{
    profileSlug: string;
    mapSlug: string;
    pinSlug: string;
  }>();
  const navigate = useNavigate();
  const isWideEnough = useMinMd();
  const { maps, activeMapId } = useMap();

  const mapForRoute = useMemo(() => {
    if (!profileSlug?.trim() || !mapSlug?.trim()) return null;
    const profileNeedle = profileSlug.trim().toLowerCase();
    const mapNeedle = mapSlug.trim().toLowerCase();
    return (
      maps.find(
        (j) =>
          j.owner_profile_slug.trim().toLowerCase() === profileNeedle &&
          j.slug.trim().toLowerCase() === mapNeedle,
      ) ?? null
    );
  }, [maps, profileSlug, mapSlug]);

  const pinQuery = useQuery({
    queryKey: ["pin", mapForRoute?.id, pinSlug],
    queryFn: async () => {
      if (!mapForRoute || !pinSlug?.trim()) return null;
      const resolved = await resolvePinByMapSlug(mapForRoute.id, pinSlug);
      if (!resolved) return null;
      const { data, error } = await supabase
        .from("pins")
        .select(
          `*,
          pin_tags ( tag_id, tags ( id, name, color, icon_emoji ) ),
          creator:profiles!pins_created_by_user_id_fkey ( display_name ),
          modifier:profiles!pins_modified_by_user_id_fkey ( display_name )`,
        )
        .eq("id", resolved.pinId)
        .maybeSingle();
      if (error) throw error;
      const row = data as PinRow | null;
      if (!row) return null;
      return {
        row,
        redirectSlug: resolved.redirected ? resolved.canonicalSlug : null,
      };
    },
    enabled: Boolean(mapForRoute && pinSlug?.trim()),
  });

  const pin = pinQuery.data?.row ?? null;
  const redirectSlug = pinQuery.data?.redirectSlug ?? null;
  const { photos, signedUrlByPhotoId } = usePinPhotosSignedUrls(pin?.id);

  const mapRoute = useMemo(
    () => (mapForRoute ? mapRouteForMap(mapForRoute) : null),
    [mapForRoute],
  );

  useEffect(() => {
    if (!redirectSlug || !mapRoute) return;
    const path = pinDetailHref(mapRoute, redirectSlug);
    navigate(path, { replace: true });
  }, [redirectSlug, mapRoute, navigate]);

  const wrongMap = pin && activeMapId && pin.map_id !== activeMapId;
  const insetMapStyleOptions = useMemo(
    () => normalizeMapStyleOptions(mapForRoute),
    [mapForRoute],
  );

  if (pinQuery.isLoading) {
    return <PageCenteredLoading>Loading pin…</PageCenteredLoading>;
  }

  if (!pin || wrongMap) {
    return (
      <PageCenteredError
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const fromPin = pin
                ? maps.find((x) => x.id === pin.map_id)
                : null;
              const fallback =
                fromPin ?? maps.find((x) => x.id === activeMapId) ?? null;
              navigate(
                fallback?.owner_profile_slug && fallback.slug
                  ? mapViewHref("map", mapRouteForMap(fallback))
                  : "/",
              );
            }}
          >
            Home
          </Button>
        }
      >
        Pin not found or not in this map.
      </PageCenteredError>
    );
  }

  const mapHref = mapRoute
    ? mapHrefWithSearch(
        mapRoute,
        (() => {
          const baseParams = isWideEnough
            ? applySelectedPinToSearchParams(new URLSearchParams(), pin.slug)
            : new URLSearchParams();
          const params = applyMapCameraToSearchParams(
            baseParams,
            normalizeCameraForUrl({
              lat: pin.lat,
              lng: pin.lng,
              zoom: PIN_FOCUS_ZOOM,
            }),
          );
          return `?${params.toString()}`;
        })(),
      )
    : null;

  const insetMarkerTag =
    (pin.pin_tags ?? []).map((tt) => tt.tags).filter(Boolean)[0] ?? null;

  return (
    <AppPageLayout width="2xl">
      <PinDetailPageNav
        mapHref={mapHref}
        mapName={mapForRoute?.name.trim() || "Map"}
        mapEmoji={mapForRoute?.icon_emoji ?? defaultMapIcon()}
      />
      <PagePanel>
        <PinDetailBody
          pin={pin}
          photos={photos}
          signedUrlByPhotoId={signedUrlByPhotoId}
          permalinkMapRoute={mapRoute ?? undefined}
          topContent={
            isWideEnough && mapHref ? (
              <PinDetailInsetMapView
                lng={pin.lng}
                lat={pin.lat}
                markerEmoji={insetMarkerTag?.icon_emoji ?? "📍"}
                markerColor={insetMarkerTag?.color ?? null}
                mapHref={mapHref}
                mapAriaLabel="Open this pin on the map"
                mapStyle={normalizeMapStylePreset(mapForRoute?.style)}
                mapStyleOptions={insetMapStyleOptions}
              />
            ) : null
          }
        />
      </PagePanel>
    </AppPageLayout>
  );
}
