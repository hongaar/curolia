import { PageBackButton } from "@/components/layout/page-back-button";
import { PinDetailBody, type PinRow } from "@/components/pins/pin-detail-body";
import { PinDetailInsetMapView } from "@/components/pins/pin-detail-inset-map";
import { useMinMd } from "@/hooks/use-min-md";
import { mapHrefWithSearch, mapViewHref } from "@/lib/app-paths";
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
import { supabase } from "@/lib/supabase";
import { usePinPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useMap } from "@/providers/map-provider";
import { Button } from "@curolia/ui/button";
import {
  AppPageLayout,
  PageCenteredError,
  PageCenteredLoading,
} from "@curolia/ui/page";
import { PinDetailCard } from "@curolia/ui/pin-detail";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function PinDetailPage() {
  const { mapSlug, pinSlug } = useParams<{
    mapSlug: string;
    pinSlug: string;
  }>();
  const navigate = useNavigate();
  const isWideEnough = useMinMd();
  const { maps, activeMapId } = useMap();

  const mapForRoute = useMemo(
    () =>
      maps.find(
        (j) => j.slug.toLowerCase() === mapSlug?.trim().toLowerCase(),
      ) ?? null,
    [maps, mapSlug],
  );

  const pinQuery = useQuery({
    queryKey: ["pin", mapForRoute?.id, pinSlug],
    queryFn: async () => {
      if (!mapForRoute || !pinSlug?.trim()) return null;
      const slugNorm = pinSlug.trim().toLowerCase();
      const { data, error } = await supabase
        .from("pins")
        .select(
          `*,
          pin_tags ( tag_id, tags ( id, name, color, icon_emoji ) ),
          creator:profiles!pins_created_by_user_id_fkey ( display_name ),
          modifier:profiles!pins_modified_by_user_id_fkey ( display_name )`,
        )
        .eq("map_id", mapForRoute.id)
        .eq("slug", slugNorm)
        .maybeSingle();
      if (error) throw error;
      return data as PinRow | null;
    },
    enabled: Boolean(mapForRoute && pinSlug?.trim()),
  });

  const pin = pinQuery.data;
  const { photos, signedUrlByPhotoId } = usePinPhotosSignedUrls(pin?.id);

  const wrongMap = pin && activeMapId && pin.map_id !== activeMapId;
  const insetMapStyleOptions = useMemo(
    () => normalizeMapStyleOptions(mapForRoute),
    [mapForRoute?.style_hillshades, mapForRoute?.style_satellite_labels],
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
              const fromPin =
                pin && maps.find((x) => x.id === pin.map_id)?.slug?.trim();
              const slug =
                fromPin || maps.find((x) => x.id === activeMapId)?.slug?.trim();
              navigate(slug ? mapViewHref("map", slug) : "/");
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

  const mapSlugForMap = mapForRoute?.slug?.trim() ?? mapSlug?.trim();
  const mapHref =
    mapSlugForMap != null && mapSlugForMap !== ""
      ? mapHrefWithSearch(
          mapSlugForMap,
          (() => {
            // Narrow screens redirect ?pin= back to pin detail — omit it when
            // leaving pin detail for the map; camera still focuses the pin.
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
      <PageBackButton />
      <PinDetailCard>
        <PinDetailBody
          pin={pin}
          photos={photos}
          signedUrlByPhotoId={signedUrlByPhotoId}
          topContent={
            mapHref ? (
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
      </PinDetailCard>
    </AppPageLayout>
  );
}
