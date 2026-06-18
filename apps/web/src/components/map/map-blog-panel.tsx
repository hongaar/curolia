import { FloatingPanel } from "@/components/layout/floating-panel";
import { BlogPinListSortLead } from "@/components/map/blog-pin-list-sort-lead";
import { PinBlogMetaSummaries } from "@/components/map/pin-blog-meta-summaries";
import { PublicMapOwnerCard } from "@/components/map/public-map-owner-card";
import { useBlogPinListSort } from "@/hooks/use-blog-pin-list-order";
import { useMapOwnerCard } from "@/hooks/use-map-owner-card";
import { orderedBlogPinList } from "@/lib/blog-pin-list-order";
import { formatPinDateRange } from "@/lib/pin-dates";
import {
  photosToGalleryItems,
  pinPhotoGalleryPlaceholderCount,
} from "@/lib/pin-photo-gallery-items";
import { photosToLightboxItems } from "@/lib/pin-photo-lightbox-items";
import { filterPinsByTags, type PinWithTags } from "@/lib/pin-with-tags";
import { supabase } from "@/lib/supabase";
import { useMapPinsPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useMap } from "@/providers/map-provider";
import type { Photo } from "@/types/database";
import { contrastingForeground } from "@curolia/ui";
import {
  BlogContent,
  BlogEmptyPanel,
  BlogHeader,
  BlogPinActions,
  BlogPinDate,
  BlogPinDescription,
  BlogPinGallery,
  BlogPinList,
  BlogPinTitle,
  BlogPinTitleButton,
  BlogPinTitleLink,
  BlogScroll,
  BlogTagRow,
  BlogTitle,
} from "@curolia/ui/blog";
import { Button } from "@curolia/ui/button";
import {
  MapBlogSidePanelContent,
  MapBlogSidePanelGallery,
  MapBlogSidePanelPinBody,
  MapBlogSidePanelScroll,
} from "@curolia/ui/map";
import { PageMuted } from "@curolia/ui/page";
import { PinPhotoGallery } from "@curolia/ui/pin-photo-gallery";
import { PinPhotoLightbox } from "@curolia/ui/pin-photo-lightbox";
import { TagBadge } from "@curolia/ui/tag-badge";
import { useQuery } from "@tanstack/react-query";
import { PanelRight } from "lucide-react";
import { useMemo, useRef, useState, type RefObject } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type { MapPanelPinConnectorAnchor } from "@/components/map/map-panel-pin-connector";
import { pinDetailHref } from "@/lib/app-paths";
import type { MapRoute } from "@/lib/map-route";
import { mapRouteForMap } from "@/lib/map-route";
import { resolveFilterTagIdsFromSearchParams } from "@/lib/map-view-params";

type MapBlogPanelProps = {
  mapSlug: string | undefined;
  /** Embedded in the map page side panel — pin links open the map pin sheet. */
  embedded?: boolean;
  onViewPin?: (pinId: string) => void;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
  /** Desktop map+blog: hover a pin section to focus it on the map. */
  onPinHover?: (pinId: string, anchor: MapPanelPinConnectorAnchor) => void;
  onPinHoverEnd?: () => void;
};

export function MapBlogPanel({
  mapSlug,
  embedded = false,
  onViewPin,
  scrollRootRef,
  onPinHover,
  onPinHoverEnd,
}: MapBlogPanelProps) {
  const [searchParams] = useSearchParams();
  const { activeMapId, activeMap, loading: mapLoading } = useMap();
  const {
    order: blogListOrder,
    direction: blogListDirection,
    setOrder: setBlogListOrder,
    setDirection: setBlogListDirection,
  } = useBlogPinListSort(activeMapId);

  const blogMapRoute = activeMap ? mapRouteForMap(activeMap) : null;
  const { profile: ownerProfile, show: showOwnerCard } = useMapOwnerCard();
  const [photoLightbox, setPhotoLightbox] = useState<{
    pinId: string;
    photoId: string;
  } | null>(null);

  const pinsQuery = useQuery({
    queryKey: ["pins", activeMapId, "blog"],
    queryFn: async () => {
      if (!activeMapId) return [];
      const { data, error } = await supabase
        .from("pins")
        .select(
          `*,
          pin_tags ( tag_id, tags ( id, name, color, icon_emoji ) )`,
        )
        .eq("map_id", activeMapId)
        .order("date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as PinWithTags[];
    },
    enabled: Boolean(activeMapId) && !mapLoading,
  });

  const tagsQuery = useQuery({
    queryKey: ["tags", activeMapId],
    queryFn: async () => {
      if (!activeMapId) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, slug")
        .eq("map_id", activeMapId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(activeMapId) && !mapLoading,
  });

  const tags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);
  const filterTagIds = useMemo(
    () => resolveFilterTagIdsFromSearchParams(searchParams, tags),
    [searchParams, tags],
  );

  const pins = useMemo(() => pinsQuery.data ?? [], [pinsQuery.data]);
  const visible = useMemo(
    () => filterPinsByTags(pins, filterTagIds),
    [pins, filterTagIds],
  );
  const orderedVisible = useMemo(
    () =>
      orderedBlogPinList(visible, {
        order: blogListOrder,
        direction: blogListDirection,
      }),
    [visible, blogListOrder, blogListDirection],
  );
  const visiblePinIds = useMemo(
    () => orderedVisible.map((t) => t.id),
    [orderedVisible],
  );
  const { photosByPinId, signedUrlByPhotoId } = useMapPinsPhotosSignedUrls(
    activeMapId ?? undefined,
    visiblePinIds,
  );

  const blogLightboxItems = useMemo(() => {
    if (!photoLightbox) return [];
    const ps = photosByPinId.get(photoLightbox.pinId) ?? [];
    return photosToLightboxItems(ps, signedUrlByPhotoId);
  }, [photoLightbox, photosByPinId, signedUrlByPhotoId]);

  const blogLightboxTitle = useMemo(() => {
    if (!photoLightbox) return undefined;
    const t = orderedVisible.find((x) => x.id === photoLightbox.pinId);
    return t?.title?.trim() || "Untitled pin";
  }, [photoLightbox, orderedVisible]);

  const blogHeader = (
    <BlogHeader>
      <BlogTitle>{activeMap?.name?.trim() || mapSlug || "Map"}</BlogTitle>
      {showOwnerCard && ownerProfile ? (
        <PublicMapOwnerCard profile={ownerProfile} />
      ) : null}
      <BlogPinListSortLead
        order={blogListOrder}
        direction={blogListDirection}
        onOrderChange={setBlogListOrder}
        onDirectionChange={setBlogListDirection}
      />
    </BlogHeader>
  );

  const emptyPanel =
    visible.length === 0 ? (
      <FloatingPanel>
        <BlogEmptyPanel>
          <PageMuted>
            {pins.length === 0
              ? "No pins yet — add one from the toolbar."
              : "No pins match the current filters."}
          </PageMuted>
        </BlogEmptyPanel>
      </FloatingPanel>
    ) : null;

  const pinList =
    visible.length > 0 ? (
      <BlogPinList>
        {orderedVisible.map((t) => (
          <BlogPinEntry
            key={t.id}
            pin={t}
            blogMapRoute={blogMapRoute}
            photosByPinId={photosByPinId}
            signedUrlByPhotoId={signedUrlByPhotoId}
            embedded={embedded}
            onViewPin={onViewPin}
            onPinHover={onPinHover}
            onPinHoverEnd={onPinHoverEnd}
            onOpenPhoto={(photoId) =>
              setPhotoLightbox({ pinId: t.id, photoId })
            }
          />
        ))}
      </BlogPinList>
    ) : null;

  const scrollBody = (
    <BlogContent>
      {blogHeader}
      {emptyPanel}
      {pinList}
    </BlogContent>
  );

  return (
    <>
      {embedded ? (
        <MapBlogSidePanelScroll ref={scrollRootRef}>
          <MapBlogSidePanelContent>
            {blogHeader}
            {emptyPanel}
          </MapBlogSidePanelContent>
          {pinList}
        </MapBlogSidePanelScroll>
      ) : (
        <BlogScroll ref={scrollRootRef}>{scrollBody}</BlogScroll>
      )}

      <PinPhotoLightbox
        open={photoLightbox !== null}
        onOpenChange={(o) => {
          if (!o) setPhotoLightbox(null);
        }}
        items={blogLightboxItems}
        initialPhotoId={photoLightbox?.photoId ?? null}
        title={blogLightboxTitle}
      />
    </>
  );
}

function BlogPinEntry({
  pin: t,
  blogMapRoute,
  photosByPinId,
  signedUrlByPhotoId,
  embedded,
  onViewPin,
  onPinHover,
  onPinHoverEnd,
  onOpenPhoto,
}: {
  pin: PinWithTags;
  blogMapRoute: MapRoute | null;
  photosByPinId: Map<string, Photo[]>;
  signedUrlByPhotoId: Record<string, string>;
  embedded: boolean;
  onViewPin?: (pinId: string) => void;
  onPinHover?: (pinId: string, anchor: MapPanelPinConnectorAnchor) => void;
  onPinHoverEnd?: () => void;
  onOpenPhoto: (photoId: string) => void;
}) {
  const titleAnchorRef = useRef<HTMLSpanElement>(null);
  const pinEntryRef = useRef<HTMLLIElement>(null);
  const tagRows = (t.pin_tags ?? []).map((tt) => tt.tags).filter(Boolean) as {
    id: string;
    name: string;
    color: string;
    icon_emoji: string | null;
  }[];
  const pinPhotos = photosByPinId.get(t.id) ?? [];
  const galleryItems = photosToGalleryItems(pinPhotos, signedUrlByPhotoId);
  const photoPlaceholders = pinPhotoGalleryPlaceholderCount(
    pinPhotos,
    galleryItems,
  );
  const pinSlug = t.slug?.trim();
  const detailHref =
    blogMapRoute && pinSlug ? pinDetailHref(blogMapRoute, pinSlug) : "#";

  const titleBlock = (
    <>
      {t.date ? (
        <BlogPinDate dateTime={t.date}>
          {formatPinDateRange(t.date, t.end_date)}
        </BlogPinDate>
      ) : null}
      <BlogPinTitle spaced={Boolean(t.date)}>
        <span ref={titleAnchorRef} data-blog-pin-title-anchor>
          {embedded && onViewPin ? (
            <BlogPinTitleButton onClick={() => onViewPin(t.id)}>
              {t.title?.trim() || "Untitled pin"}
            </BlogPinTitleButton>
          ) : (
            <BlogPinTitleLink to={detailHref}>
              {t.title?.trim() || "Untitled pin"}
            </BlogPinTitleLink>
          )}
        </span>
      </BlogPinTitle>
      {tagRows.length > 0 ? (
        <BlogTagRow>
          {tagRows.map((tag) => (
            <TagBadge
              key={tag.id}
              style={{
                backgroundColor: tag.color,
                color: contrastingForeground(tag.color),
              }}
            >
              {tag.icon_emoji ? <span>{tag.icon_emoji}</span> : null}
              {tag.name}
            </TagBadge>
          ))}
        </BlogTagRow>
      ) : null}
      {t.description?.trim() ? (
        <BlogPinDescription markdown={t.description.trim()} />
      ) : null}
    </>
  );

  const actionsBlock = (
    <>
      <PinBlogMetaSummaries mapId={t.map_id} pinId={t.id} />
      <BlogPinActions>
        {embedded && onViewPin ? (
          <Button variant="secondary" onClick={() => onViewPin(t.id)}>
            Pin details
            <PanelRight aria-hidden />
          </Button>
        ) : (
          <Button
            variant="secondary"
            render={
              <Link
                to={detailHref}
                onClick={(e) => {
                  if (detailHref === "#") e.preventDefault();
                }}
              />
            }
          >
            Pin details
            <PanelRight aria-hidden />
          </Button>
        )}
      </BlogPinActions>
    </>
  );

  const galleryBlock =
    pinPhotos.length > 0 || photoPlaceholders > 0 ? (
      embedded ? (
        <MapBlogSidePanelGallery>
          <PinPhotoGallery
            items={galleryItems}
            loadingPlaceholders={photoPlaceholders}
            rowPreset="blog-panel"
            onOpen={onOpenPhoto}
          />
        </MapBlogSidePanelGallery>
      ) : (
        <BlogPinGallery>
          <PinPhotoGallery
            items={galleryItems}
            loadingPlaceholders={photoPlaceholders}
            onOpen={onOpenPhoto}
          />
        </BlogPinGallery>
      )
    ) : null;

  return (
    <li
      ref={pinEntryRef}
      data-blog-pin-id={t.id}
      onMouseEnter={
        embedded && onPinHover
          ? () => {
              const titleAnchor = titleAnchorRef.current;
              const pinEntry = pinEntryRef.current;
              if (titleAnchor && pinEntry) {
                onPinHover(t.id, { lineAnchor: titleAnchor, pinEntry });
              }
            }
          : undefined
      }
      onMouseLeave={embedded ? onPinHoverEnd : undefined}
    >
      <article>
        {embedded ? (
          <MapBlogSidePanelPinBody>{titleBlock}</MapBlogSidePanelPinBody>
        ) : (
          titleBlock
        )}
        {galleryBlock}
        {embedded ? (
          <MapBlogSidePanelPinBody>{actionsBlock}</MapBlogSidePanelPinBody>
        ) : (
          actionsBlock
        )}
      </article>
    </li>
  );
}
