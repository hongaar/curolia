import { FloatingPanel } from "@/components/layout/floating-panel";
import { BlogPinListSortLead } from "@/components/map/blog-pin-list-sort-lead";
import type { MapPanelPinConnectorAnchor } from "@/components/map/map-panel-pin-connector";
import { PublicMapOwnerCard } from "@/components/map/public-map-owner-card";
import { useBlogPinListSort } from "@/hooks/use-blog-pin-list-order";
import { useMapOwnerCard } from "@/hooks/use-map-owner-card";
import { orderedBlogPinList } from "@/lib/blog-pin-list-order";
import { formatPinDateRange } from "@/lib/pin-dates";
import { filterPinsByTags, type PinWithTags } from "@/lib/pin-with-tags";
import { supabase } from "@/lib/supabase";
import { useMapPinsPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useMap } from "@/providers/map-provider";
import type { Photo } from "@/types/database";
import { contrastingForeground } from "@curolia/ui";
import {
  BlogEmptyPanel,
  BlogFullWidthContent,
  BlogHeader,
  BlogScroll,
  BlogTitle,
} from "@curolia/ui/blog";
import {
  MapBlogSidePanelGallery,
  MapBlogSidePanelGalleryHeader,
  MapBlogSidePanelScroll,
} from "@curolia/ui/map";
import { MapCardMasonryGrid } from "@curolia/ui/map-card";
import { PageMuted } from "@curolia/ui/page";
import {
  PinCard,
  PinCardEmptyState,
  PinCardTagRow,
} from "@curolia/ui/pin-card";
import { TagBadge } from "@curolia/ui/tag-badge";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useSearchParams } from "react-router-dom";

import { pinDetailHref } from "@/lib/app-paths";
import type { MapRoute } from "@/lib/map-route";
import { mapRouteForMap } from "@/lib/map-route";
import { resolveFilterTagIdsFromSearchParams } from "@/lib/map-view-params";

type MapGalleryPanelProps = {
  mapSlug: string | undefined;
  /** Embedded in the map page side panel — cards open the map pin sheet. */
  embedded?: boolean;
  onViewPin?: (pinId: string) => void;
  scrollRootRef?: RefObject<HTMLDivElement | null>;
  onPinHover?: (pinId: string, anchor: MapPanelPinConnectorAnchor) => void;
  onPinHoverEnd?: () => void;
  /** Masonry column count — side panel uses 3, fullscreen mobile uses 4. */
  gridColumns?: 3 | 4;
};

function photoCountLabel(count: number): string | undefined {
  if (count <= 0) return undefined;
  return count === 1 ? "1 photo" : `${count} photos`;
}

function firstPhotoCoverUrl(
  photos: Photo[],
  signedUrlByPhotoId: Record<string, string>,
): string | null {
  const first = photos[0];
  if (!first) return null;
  return signedUrlByPhotoId[first.id] ?? null;
}

export function MapGalleryPanel({
  mapSlug,
  embedded = false,
  onViewPin,
  scrollRootRef,
  onPinHover,
  onPinHoverEnd,
  gridColumns = 3,
}: MapGalleryPanelProps) {
  const [searchParams] = useSearchParams();
  const { activeMapId, activeMap, loading: mapLoading } = useMap();
  const {
    order: listOrder,
    direction: listDirection,
    setOrder: setListOrder,
    setDirection: setListDirection,
  } = useBlogPinListSort(activeMapId);
  const galleryMapRoute = activeMap ? mapRouteForMap(activeMap) : null;
  const { profile: ownerProfile, show: showOwnerCard } = useMapOwnerCard();

  const pinsQuery = useQuery({
    queryKey: ["pins", activeMapId, "gallery"],
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
        order: listOrder,
        direction: listDirection,
      }),
    [visible, listOrder, listDirection],
  );
  const visiblePinIds = useMemo(
    () => orderedVisible.map((pin) => pin.id),
    [orderedVisible],
  );
  const { photosByPinId, signedUrlByPhotoId } = useMapPinsPhotosSignedUrls(
    activeMapId ?? undefined,
    visiblePinIds,
  );

  const galleryHeader = (
    <BlogHeader>
      <BlogTitle>{activeMap?.name?.trim() || mapSlug || "Map"}</BlogTitle>
      {showOwnerCard && ownerProfile ? (
        <PublicMapOwnerCard profile={ownerProfile} />
      ) : null}
      <BlogPinListSortLead
        order={listOrder}
        direction={listDirection}
        onOrderChange={setListOrder}
        onDirectionChange={setListDirection}
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

  const grid =
    visible.length > 0 ? (
      <MapCardMasonryGrid columns={gridColumns}>
        {orderedVisible.map((pin) => (
          <GalleryPinCard
            key={pin.id}
            pin={pin}
            galleryMapRoute={galleryMapRoute}
            photos={photosByPinId.get(pin.id) ?? []}
            signedUrlByPhotoId={signedUrlByPhotoId}
            embedded={embedded}
            onViewPin={onViewPin}
            onPinHover={onPinHover}
            onPinHoverEnd={onPinHoverEnd}
          />
        ))}
      </MapCardMasonryGrid>
    ) : (
      <PinCardEmptyState>No pins to show.</PinCardEmptyState>
    );

  if (embedded) {
    return (
      <MapBlogSidePanelScroll ref={scrollRootRef}>
        <MapBlogSidePanelGalleryHeader>
          {galleryHeader}
          {emptyPanel}
        </MapBlogSidePanelGalleryHeader>
        <MapBlogSidePanelGallery>{grid}</MapBlogSidePanelGallery>
      </MapBlogSidePanelScroll>
    );
  }

  return (
    <BlogScroll>
      <BlogFullWidthContent>
        {galleryHeader}
        {emptyPanel}
        {grid}
      </BlogFullWidthContent>
    </BlogScroll>
  );
}

function GalleryPinCard({
  pin,
  galleryMapRoute,
  photos,
  signedUrlByPhotoId,
  embedded,
  onViewPin,
  onPinHover,
  onPinHoverEnd,
}: {
  pin: PinWithTags;
  galleryMapRoute: MapRoute | null;
  photos: Photo[];
  signedUrlByPhotoId: Record<string, string>;
  embedded: boolean;
  onViewPin?: (pinId: string) => void;
  onPinHover?: (pinId: string, anchor: MapPanelPinConnectorAnchor) => void;
  onPinHoverEnd?: () => void;
}) {
  const pinEntryRef = useRef<HTMLElement>(null);
  const lineAnchorRef = useRef<HTMLHeadingElement>(null);
  const title = pin.title?.trim() || "Untitled pin";
  const description = pin.description?.trim() || undefined;
  const coverUrl = firstPhotoCoverUrl(photos, signedUrlByPhotoId);
  const dateLabel = pin.date
    ? formatPinDateRange(pin.date, pin.end_date)
    : undefined;
  const photoLabel = photoCountLabel(photos.length);
  const detailHref = galleryMapRoute
    ? pinDetailHref(galleryMapRoute, pin.slug)
    : "#";
  const tagRow = pinTagRow(pin);

  const hoverHandlers =
    embedded && onPinHover
      ? {
          onMouseEnter: () => {
            const lineAnchor = lineAnchorRef.current;
            const pinEntry = pinEntryRef.current;
            if (lineAnchor && pinEntry) {
              onPinHover(pin.id, { lineAnchor, pinEntry });
            }
          },
          onMouseLeave: onPinHoverEnd,
        }
      : {};

  const cardProps = {
    title,
    description,
    coverUrl: coverUrl ?? undefined,
    dateLabel,
    photoCountLabel: photoLabel,
    tags: tagRow,
    pinId: pin.id,
    pinEntryRef,
    lineAnchorRef,
    ...hoverHandlers,
  };

  if (embedded && onViewPin) {
    return <PinCard {...cardProps} onSelect={() => onViewPin(pin.id)} />;
  }

  return <PinCard {...cardProps} to={detailHref} />;
}

type PinTag = {
  id: string;
  name: string;
  color: string;
  icon_emoji: string | null;
};

function pinTags(pin: PinWithTags): PinTag[] {
  return (pin.pin_tags ?? []).map((tt) => tt.tags).filter(Boolean) as PinTag[];
}

function pinTagRow(pin: PinWithTags): ReactNode {
  const tags = pinTags(pin);
  if (tags.length === 0) return undefined;
  return (
    <PinCardTagRow>
      {tags.map((tag) => (
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
    </PinCardTagRow>
  );
}
