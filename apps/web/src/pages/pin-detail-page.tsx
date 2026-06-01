import { PageBackButton } from "@/components/layout/page-back-button";
import { PinDetailInsetMapView } from "@/components/pins/pin-detail-inset-map";
import { PinFormDialogTrigger } from "@/components/pins/pin-form-dialog";
import { PinLinksList } from "@/components/pins/pin-links-list";
import { PinMetadataFooter } from "@/components/pins/pin-metadata-footer";
import { mapHrefWithSearch, mapViewHref } from "@/lib/app-paths";
import {
  applyMapCameraToSearchParams,
  applySelectedPinToSearchParams,
  normalizeCameraForUrl,
  PIN_FOCUS_ZOOM,
} from "@/lib/map-view-params";
import { formatPinDateRange } from "@/lib/pin-dates";
import {
  photoMasonrySource,
  photosToLightboxItems,
} from "@/lib/pin-photo-lightbox-items";
import { supabase } from "@/lib/supabase";
import { usePinPhotosSignedUrls } from "@/lib/use-pin-photos";
import { getPluginDefinition, pluginList } from "@/plugins/registry";
import { useAuth } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import type { Pin } from "@/types/database";
import { contrastingForeground } from "@curolia/ui";
import { Button } from "@curolia/ui/button";
import {
  AppPageLayout,
  PageCenteredError,
  PageCenteredLoading,
} from "@curolia/ui/page";
import {
  PinDetailActions,
  PinDetailCard,
  PinDetailContent,
  PinDetailDescription,
  PinDetailHeader,
  PinDetailSubtitle,
  PinDetailTagBadge,
  PinDetailTagRow,
  PinDetailTitle,
} from "@curolia/ui/pin-detail";
import { PinPhotoLightbox } from "@curolia/ui/pin-photo-lightbox";
import { PinPhotoMasonry } from "@curolia/ui/pin-photo-masonry";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

type PinRow = Pin & {
  pin_tags?: {
    tag_id: string;
    tags: {
      id: string;
      name: string;
      color: string;
      icon_emoji: string;
    } | null;
  }[];
  creator?: { display_name: string | null } | null;
  modifier?: { display_name: string | null } | null;
};

export function PinDetailPage() {
  const { mapSlug, pinSlug } = useParams<{
    mapSlug: string;
    pinSlug: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { maps, activeMapId } = useMap();
  const [photoLightbox, setPhotoLightbox] = useState<{
    photoId: string;
  } | null>(null);

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

  const pinIdResolved = pinQuery.data?.id;

  const {
    photos,
    signedUrlByPhotoId,
    isLoading: photosLoading,
  } = usePinPhotosSignedUrls(pinIdResolved);

  const pin = pinQuery.data;
  const wrongMap = pin && activeMapId && pin.map_id !== activeMapId;

  const tagBadges = useMemo(() => {
    const rows = pin?.pin_tags ?? [];
    return rows.map((tt) => tt.tags).filter(Boolean) as {
      id: string;
      name: string;
      color: string;
      icon_emoji: string;
    }[];
  }, [pin]);

  const lightboxItems = useMemo(
    () => photosToLightboxItems(photos, signedUrlByPhotoId),
    [photos, signedUrlByPhotoId],
  );

  const masonryItems = useMemo(() => {
    const out: Parameters<typeof PinPhotoMasonry>[0]["items"] = [];
    for (const p of photos) {
      const url = signedUrlByPhotoId[p.id];
      if (!url) continue;
      const source = photoMasonrySource(p);
      let sourceIcon: ReactNode | undefined;
      let sourceLabel: string | undefined;
      if (source?.sourcePluginId) {
        const plugin = getPluginDefinition(source.sourcePluginId);
        if (plugin) {
          const Icon = plugin.icon;
          sourceIcon = <Icon size={5} />;
          sourceLabel = `Open in ${plugin.displayName}`;
        }
      }
      out.push({
        id: p.id,
        url,
        ...(source?.originalProductUrl
          ? { originalProductUrl: source.originalProductUrl }
          : {}),
        ...(sourceIcon ? { sourceIcon } : {}),
        ...(sourceLabel ? { sourceLabel } : {}),
        ...(sourceLabel
          ? { sourceTooltip: `${sourceLabel} — opens in a new tab` }
          : {}),
      });
    }
    return out;
  }, [photos, signedUrlByPhotoId]);

  const photoPlaceholders =
    photosLoading && photos.length > 0
      ? Math.max(0, photos.length - masonryItems.length)
      : 0;

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

  const pinDateSubtitle = formatPinDateRange(pin.date, pin.end_date);

  const mapSlugForMap = mapForRoute?.slug?.trim() ?? mapSlug?.trim();
  const mapHref =
    mapSlugForMap != null && mapSlugForMap !== ""
      ? mapHrefWithSearch(
          mapSlugForMap,
          (() => {
            const withPin = applySelectedPinToSearchParams(
              new URLSearchParams(),
              pin.slug,
            );
            const params = applyMapCameraToSearchParams(
              withPin,
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

  const insetMarkerTag = tagBadges[0] ?? null;

  return (
    <AppPageLayout width="2xl">
      <PageBackButton />
      <PinDetailCard>
        <PinDetailHeader>
          <div>
            <PinDetailTitle>{pin.title || "Untitled place"}</PinDetailTitle>
            {pinDateSubtitle ? (
              <PinDetailSubtitle>{pinDateSubtitle}</PinDetailSubtitle>
            ) : null}
            <PinDetailTagRow>
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
            </PinDetailTagRow>
          </div>
          <PinDetailActions>
            <PinFormDialogTrigger
              mapId={pin.map_id}
              pin={pin}
              variant="outline"
              size="sm"
            />
          </PinDetailActions>
        </PinDetailHeader>
        <PinDetailContent>
          {mapHref ? (
            <PinDetailInsetMapView
              lng={pin.lng}
              lat={pin.lat}
              markerEmoji={insetMarkerTag?.icon_emoji ?? "📍"}
              markerColor={insetMarkerTag?.color ?? null}
              mapHref={mapHref}
              mapAriaLabel="Open this pin on the map"
            />
          ) : null}
          {pin.description ? (
            <PinDetailDescription>{pin.description}</PinDetailDescription>
          ) : null}
          {photos.length > 0 || photoPlaceholders > 0 ? (
            <PinPhotoMasonry
              items={masonryItems}
              loadingPlaceholders={photoPlaceholders}
              onOpen={(photoId) => setPhotoLightbox({ photoId })}
            />
          ) : null}
          <PinLinksList pinId={pin.id} />
          {pluginList.map((p) => {
            const Section = p.PinDetailSection;
            if (!Section) return null;
            return (
              <Section
                key={`detail-${p.id}`}
                supabase={supabase}
                userId={user?.id}
                pinId={pin.id}
                mapId={pin.map_id}
                pinDate={pin.date}
                pinEndDate={pin.end_date}
              />
            );
          })}
          <PinMetadataFooter
            createdAt={pin.created_at}
            updatedAt={pin.updated_at}
            creatorDisplayName={pin.creator?.display_name}
            modifierDisplayName={pin.modifier?.display_name}
          />
        </PinDetailContent>
      </PinDetailCard>
      <PinPhotoLightbox
        open={photoLightbox !== null}
        onOpenChange={(o) => {
          if (!o) setPhotoLightbox(null);
        }}
        items={lightboxItems}
        initialPhotoId={photoLightbox?.photoId ?? null}
        title={pin.title?.trim() || "Untitled place"}
      />
    </AppPageLayout>
  );
}
