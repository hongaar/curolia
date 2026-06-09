import { PinFormDialogTrigger } from "@/components/pins/pin-form-dialog-trigger";
import { PinLinksList } from "@/components/pins/pin-links-list";
import { PinMetadataFooter } from "@/components/pins/pin-metadata-footer";
import { PinPlaceMetadataList } from "@/components/pins/pin-place-metadata-list";
import { useMapMemberRole } from "@/hooks/use-map-access";
import { pinDetailHref } from "@/lib/app-paths";
import type { MapRoute } from "@/lib/map-route";
import { buildPinSubtitleRows } from "@/lib/pin-detail-subtitle";
import {
  photosToGalleryItems,
  pinPhotoGalleryPlaceholderCount,
} from "@/lib/pin-photo-gallery-items";
import { photosToLightboxItems } from "@/lib/pin-photo-lightbox-items";
import { supabase } from "@/lib/supabase";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { usePinMetadataSubtitle } from "@/lib/use-pin-metadata-subtitle";
import { useAuth } from "@/providers/auth-provider";
import type { Photo, Pin } from "@/types/database";
import {
  OPEN_METEO_PLUGIN_ID,
  OpenMeteoPinWeatherSubtitle,
  useOpenMeteoPinSubtitle,
} from "@curolia/plugin-open-meteo";
import { POI_PLUGIN_ID } from "@curolia/plugin-poi";
import { pinLocationLabel } from "@curolia/services/geocoding";
import { contrastingForeground } from "@curolia/ui";
import { Button } from "@curolia/ui/button";
import {
  PinDetailActions,
  PinDetailContent,
  PinDetailDescription,
  PinDetailHeader,
  PinDetailHeaderMain,
  PinDetailSubtitleStack,
  PinDetailTagBadge,
  PinDetailTagRow,
  PinDetailTitle,
} from "@curolia/ui/pin-detail";
import { PinMetadataSubtitleContent } from "@curolia/ui/pin-metadata-subtitle";
import { PinPhotoGallery } from "@curolia/ui/pin-photo-gallery";
import { PinPhotoLightbox } from "@curolia/ui/pin-photo-lightbox";
import { Link2Icon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

export type PinRow = Pin & {
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

interface PinDetailBodyProps {
  pin: PinRow;
  photos: Photo[];
  signedUrlByPhotoId: Record<string, string>;
  /** Extra elements rendered inside PinDetailActions alongside the Edit button. */
  extraActions?: ReactNode;
  /** Content rendered at the top of the content section (e.g. inset map). */
  topContent?: ReactNode;
  /**
   * When provided (e.g. in the map side sheet), renders a small permalink icon
   * that links to the standalone pin detail page for this pin.
   */
  permalinkMapRoute?: MapRoute;
}

export function PinDetailBody({
  pin,
  photos,
  signedUrlByPhotoId,
  extraActions,
  topContent,
  permalinkMapRoute,
}: PinDetailBodyProps) {
  const { user } = useAuth();
  const { plugins: enabledPlugins } = useEnabledPlugins();
  const { canEdit } = useMapMemberRole(pin.map_id);
  const [photoLightbox, setPhotoLightbox] = useState<{
    photoId: string;
  } | null>(null);

  const tagBadges = useMemo(() => {
    const rows = pin.pin_tags ?? [];
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

  const galleryItems = useMemo(
    () => photosToGalleryItems(photos, signedUrlByPhotoId),
    [photos, signedUrlByPhotoId],
  );

  const photoPlaceholders = pinPhotoGalleryPlaceholderCount(
    photos,
    galleryItems,
  );

  const openMeteoGloballyEnabled = enabledPlugins.some(
    (p) => p.id === OPEN_METEO_PLUGIN_ID,
  );
  const poiGloballyEnabled = enabledPlugins.some((p) => p.id === POI_PLUGIN_ID);
  const weatherSubtitle = useOpenMeteoPinSubtitle({
    supabase,
    pinId: pin.id,
    mapId: pin.map_id,
    lat: pin.lat,
    lng: pin.lng,
    pinDate: pin.date,
    pinEndDate: pin.end_date,
    queryEnabled: openMeteoGloballyEnabled,
  });
  const metadataSubtitle = usePinMetadataSubtitle({
    pinId: pin.id,
    mapId: pin.map_id,
  });

  const pinSubtitleRows = buildPinSubtitleRows({
    date: pin.date,
    endDate: pin.end_date,
    locationLabel: pinLocationLabel(pin),
    weather: weatherSubtitle ? (
      <OpenMeteoPinWeatherSubtitle subtitle={weatherSubtitle} />
    ) : null,
    enrichment: metadataSubtitle ? (
      <PinMetadataSubtitleContent subtitle={metadataSubtitle} />
    ) : null,
  });

  return (
    <>
      <PinDetailHeader>
        <PinDetailHeaderMain>
          <PinDetailTitle>{pin.title || "Untitled place"}</PinDetailTitle>
          <PinDetailActions>
            <PinFormDialogTrigger
              mapId={pin.map_id}
              pin={pin}
              variant="outline"
              size="sm"
            />
            {permalinkMapRoute ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open full pin detail page"
                render={
                  <Link to={pinDetailHref(permalinkMapRoute, pin.slug)} />
                }
              >
                <Link2Icon />
              </Button>
            ) : null}
            {extraActions}
          </PinDetailActions>
        </PinDetailHeaderMain>
        {pinSubtitleRows.length > 0 ? (
          <PinDetailSubtitleStack rows={pinSubtitleRows} />
        ) : null}
        {tagBadges.length > 0 ? (
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
        ) : null}
      </PinDetailHeader>
      <PinDetailContent>
        {topContent}
        {pin.description ? (
          <PinDetailDescription markdown={pin.description} />
        ) : null}
        {photos.length > 0 || photoPlaceholders > 0 ? (
          <PinPhotoGallery
            items={galleryItems}
            loadingPlaceholders={photoPlaceholders}
            onOpen={(photoId) => setPhotoLightbox({ photoId })}
          />
        ) : null}
        <PinPlaceMetadataList
          pinId={pin.id}
          mapId={pin.map_id}
          lat={pin.lat}
          lng={pin.lng}
          poiEnabled={poiGloballyEnabled}
        />
        <PinLinksList pinId={pin.id} />
        {canEdit
          ? enabledPlugins.map((p) => {
              const Slot = p.PinSuggestionSlot;
              if (!Slot) return null;
              return (
                <Slot
                  key={`suggestion-${p.id}`}
                  supabase={supabase}
                  userId={user?.id}
                  pinId={pin.id}
                  mapId={pin.map_id}
                  pinLat={pin.lat}
                  pinLng={pin.lng}
                  canEdit
                />
              );
            })
          : null}
        {enabledPlugins.map((p) => {
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
  );
}
