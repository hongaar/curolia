import { PinFormDialogTrigger } from "@/components/pins/pin-form-dialog-trigger";
import { PinLinksList } from "@/components/pins/pin-links-list";
import { PinMetadataFooter } from "@/components/pins/pin-metadata-footer";
import { pinDetailHref } from "@/lib/app-paths";
import { formatPinDetailSubtitle } from "@/lib/pin-dates";
import { combinePinDetailSubtitle } from "@/lib/pin-detail-subtitle";
import { pinLocationLabel } from "@/lib/pin-geocode";
import {
  photosToGalleryItems,
  pinPhotoGalleryPlaceholderCount,
} from "@/lib/pin-photo-gallery-items";
import { photosToLightboxItems } from "@/lib/pin-photo-lightbox-items";
import { supabase } from "@/lib/supabase";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { useAuth } from "@/providers/auth-provider";
import type { Photo, Pin } from "@/types/database";
import {
  OPEN_METEO_PLUGIN_ID,
  useOpenMeteoPinSubtitle,
} from "@curolia/plugin-open-meteo";
import { contrastingForeground } from "@curolia/ui";
import { Button } from "@curolia/ui/button";
import {
  PinDetailActions,
  PinDetailContent,
  PinDetailDescription,
  PinDetailHeader,
  PinDetailHeaderMain,
  PinDetailSubtitle,
  PinDetailTagBadge,
  PinDetailTagRow,
  PinDetailTitle,
} from "@curolia/ui/pin-detail";
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
  photosLoading: boolean;
  /** Extra elements rendered inside PinDetailActions alongside the Edit button. */
  extraActions?: ReactNode;
  /** Content rendered at the top of the content section (e.g. inset map). */
  topContent?: ReactNode;
  /**
   * When provided (e.g. in the map side sheet), renders a small permalink icon
   * that links to the standalone pin detail page for this pin.
   */
  permalinkMapSlug?: string;
}

export function PinDetailBody({
  pin,
  photos,
  signedUrlByPhotoId,
  photosLoading,
  extraActions,
  topContent,
  permalinkMapSlug,
}: PinDetailBodyProps) {
  const { user } = useAuth();
  const { plugins: enabledPlugins } = useEnabledPlugins();
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
    photosLoading,
  );

  const openMeteoGloballyEnabled = enabledPlugins.some(
    (p) => p.id === OPEN_METEO_PLUGIN_ID,
  );
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

  const pinSubtitle = combinePinDetailSubtitle(
    formatPinDetailSubtitle(pinLocationLabel(pin), pin.date, pin.end_date),
    weatherSubtitle,
  );

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
            {permalinkMapSlug ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open full pin detail page"
                render={<Link to={pinDetailHref(permalinkMapSlug, pin.slug)} />}
              >
                <Link2Icon />
              </Button>
            ) : null}
            {extraActions}
          </PinDetailActions>
        </PinDetailHeaderMain>
        {pinSubtitle ? (
          <PinDetailSubtitle>{pinSubtitle}</PinDetailSubtitle>
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
        <PinLinksList pinId={pin.id} />
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
