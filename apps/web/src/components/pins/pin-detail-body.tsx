import { PinFormDialogTrigger } from "@/components/pins/pin-form-dialog";
import { PinLinksList } from "@/components/pins/pin-links-list";
import { PinMetadataFooter } from "@/components/pins/pin-metadata-footer";
import { pinDetailHref } from "@/lib/app-paths";
import { formatPinDateRange } from "@/lib/pin-dates";
import {
  photoMasonrySource,
  photosToLightboxItems,
} from "@/lib/pin-photo-lightbox-items";
import { supabase } from "@/lib/supabase";
import { getPluginDefinition, pluginList } from "@/plugins/registry";
import { useAuth } from "@/providers/auth-provider";
import type { Photo, Pin } from "@/types/database";
import { contrastingForeground } from "@curolia/ui";
import { Button } from "@curolia/ui/button";
import {
  PinDetailActions,
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

  const pinDateSubtitle = formatPinDateRange(pin.date, pin.end_date);

  return (
    <>
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
      </PinDetailHeader>
      <PinDetailContent>
        {topContent}
        {pin.description ? (
          <PinDetailDescription markdown={pin.description} />
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
