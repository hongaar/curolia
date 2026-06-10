import { FloatingPanel } from "@/components/layout/floating-panel";
import { MapViewInitialLoader } from "@/components/layout/map-view-initial-loader";
import { MapViewSwitcher } from "@/components/layout/map-view-switcher";
import { MapSlugAccessBlocked } from "@/components/map/map-slug-access-blocked";
import { MapTagFiltersControl } from "@/components/map/map-tag-filters-control";
import { PublicMapOwnerCard } from "@/components/map/public-map-owner-card";
import { TagEntityLabelInput } from "@/components/pins/tag-entity-label-input";
import { useBlogPinListSort } from "@/hooks/use-blog-pin-list-order";
import {
  blogPinListDirectionAriaLabel,
  blogPinListDirectionLabel,
  blogPinListDirectionOptions,
  blogPinListOrderAriaLabel,
  blogPinListOrderLabel,
  orderedBlogPinList,
} from "@/lib/blog-pin-list-order";
import { formatPinDateRange } from "@/lib/pin-dates";
import {
  photosToGalleryItems,
  pinPhotoGalleryPlaceholderCount,
} from "@/lib/pin-photo-gallery-items";
import { photosToLightboxItems } from "@/lib/pin-photo-lightbox-items";
import { filterPinsByTags, type PinWithTags } from "@/lib/pin-with-tags";
import { DEFAULT_PIN_TAG_COLOR } from "@/lib/preset-pin-tag-colors";
import { supabase } from "@/lib/supabase";
import { useMapPinsPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useMap } from "@/providers/map-provider";
import type { Tag } from "@/types/database";
import { contrastingForeground } from "@curolia/ui";
import {
  BlogContent,
  BlogEmptyPanel,
  BlogHeader,
  BlogLead,
  BlogPageRoot,
  BlogPinActions,
  BlogPinDate,
  BlogPinDescription,
  BlogPinGallery,
  BlogPinList,
  BlogPinTitle,
  BlogPinTitleLink,
  BlogScroll,
  BlogSortChevron,
  BlogSortLabel,
  BlogSortTrigger,
  BlogTagRow,
  BlogTitle,
} from "@curolia/ui/blog";
import { Button } from "@curolia/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogFormStack,
  DialogHeader,
  DialogTitle,
} from "@curolia/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@curolia/ui/dropdown-menu";
import {
  MapControlsBottomCenter,
  MapControlsBottomStack,
  MapControlsLayer,
} from "@curolia/ui/map";
import { PageMuted } from "@curolia/ui/page";
import { PinPhotoGallery } from "@curolia/ui/pin-photo-gallery";
import { PinPhotoLightbox } from "@curolia/ui/pin-photo-lightbox";
import { TagBadge } from "@curolia/ui/tag-badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useCallback, useMemo, useState, type SetStateAction } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useMapMemberRole } from "@/hooks/use-map-access";
import { useMapSlugRouteSync } from "@/hooks/use-map-slug-route-sync";
import { usePublicMapOwnerProfile } from "@/hooks/use-public-map-owner-profile";
import { pinDetailHref } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import {
  applyFilterTagsToSearchParams,
  resolveFilterTagIdsFromSearchParams,
} from "@/lib/map-view-params";

export function BlogPage() {
  const qc = useQueryClient();
  const { profileSlug, mapSlug } = useParams<{
    profileSlug: string;
    mapSlug: string;
  }>();
  useMapSlugRouteSync(profileSlug, mapSlug);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    activeMapId,
    activeMap,
    loading: mapLoading,
    routeMapStatus,
    publicView,
  } = useMap();
  const { canEdit: memberCanEdit } = useMapMemberRole(activeMapId);
  const canEdit = !publicView && memberCanEdit;
  const {
    order: blogListOrder,
    direction: blogListDirection,
    setOrder: setBlogListOrder,
    setDirection: setBlogListDirection,
  } = useBlogPinListSort(activeMapId);

  const blogMapRoute = activeMap ? mapRouteForMap(activeMap) : null;
  const ownerProfileQuery = usePublicMapOwnerProfile(activeMapId, publicView);
  const ownerProfile = ownerProfileQuery.data;
  const [photoLightbox, setPhotoLightbox] = useState<{
    pinId: string;
    photoId: string;
  } | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditTarget, setTagEditTarget] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_PIN_TAG_COLOR);
  const [newTagEmoji, setNewTagEmoji] = useState("📍");
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
        .select("*")
        .eq("map_id", activeMapId)
        .order("name");
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
  const setFilterTagIds = useCallback(
    (action: SetStateAction<Set<string>>) => {
      setSearchParams(
        (prev) => {
          const current = resolveFilterTagIdsFromSearchParams(prev, tags);
          const next = typeof action === "function" ? action(current) : action;
          return applyFilterTagsToSearchParams(prev, next, tags);
        },
        { replace: true },
      );
    },
    [tags, setSearchParams],
  );

  const openEditTagDialog = (tag: Tag) => {
    setTagEditTarget(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagEmoji(tag.icon_emoji || "📍");
    setTagDialogOpen(true);
  };

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

  async function saveTag() {
    if (!activeMapId || !newTagName.trim()) return;
    if (tagEditTarget) {
      const { error } = await supabase
        .from("tags")
        .update({
          name: newTagName.trim(),
          color: newTagColor,
          icon_emoji: newTagEmoji || "📍",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tagEditTarget.id);
      if (!error) {
        setTagDialogOpen(false);
        setTagEditTarget(null);
        await qc.invalidateQueries({ queryKey: ["tags", activeMapId] });
        await qc.invalidateQueries({
          queryKey: ["pins", activeMapId, "blog"],
        });
      }
      return;
    }
    const { error } = await supabase.from("tags").insert({
      map_id: activeMapId,
      name: newTagName.trim(),
      color: newTagColor,
      icon_emoji: newTagEmoji || "📍",
    });
    if (!error) {
      setNewTagName("");
      setTagDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ["tags", activeMapId] });
    }
  }

  if (mapLoading) {
    return <MapViewInitialLoader />;
  }

  if (routeMapStatus === "unavailable") {
    return <MapSlugAccessBlocked />;
  }

  if (!activeMapId) {
    return <MapViewInitialLoader label="No map available." busy={false} />;
  }

  if (pinsQuery.isPending) {
    return <MapViewInitialLoader />;
  }

  return (
    <BlogPageRoot>
      <MapControlsLayer>
        <MapControlsBottomCenter>
          <MapViewSwitcher />
        </MapControlsBottomCenter>
        <MapControlsBottomStack>
          <MapTagFiltersControl
            tags={tags}
            filterTagIds={filterTagIds}
            setFilterTagIds={setFilterTagIds}
            onEditTag={openEditTagDialog}
            canEdit={canEdit}
          />
        </MapControlsBottomStack>
      </MapControlsLayer>

      <BlogScroll>
        <BlogContent>
          <BlogHeader>
            <BlogTitle>{activeMap?.name.trim() || mapSlug || "Map"}</BlogTitle>
            {publicView && ownerProfile ? (
              <PublicMapOwnerCard profile={ownerProfile} />
            ) : null}
            <BlogLead>
              Pins are listed in{" "}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <BlogSortTrigger
                      aria-label={blogPinListOrderAriaLabel(blogListOrder)}
                    />
                  }
                >
                  <BlogSortLabel>
                    {blogPinListOrderLabel(blogListOrder)}
                  </BlogSortLabel>
                  <BlogSortChevron>
                    <ChevronDown aria-hidden />
                  </BlogSortChevron>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup
                      value={blogListOrder}
                      onValueChange={(v) => {
                        if (
                          v === "chronological" ||
                          v === "alphabetical" ||
                          v === "created"
                        ) {
                          setBlogListOrder(v);
                        }
                      }}
                    >
                      <DropdownMenuRadioItem value="chronological">
                        Chronological
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="alphabetical">
                        Alphabetical
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="created">
                        Created
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>{" "}
              order,{" "}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <BlogSortTrigger
                      aria-label={blogPinListDirectionAriaLabel(
                        blogListOrder,
                        blogListDirection,
                      )}
                    />
                  }
                >
                  <BlogSortLabel>
                    {blogPinListDirectionLabel(
                      blogListOrder,
                      blogListDirection,
                    )}
                  </BlogSortLabel>
                  <BlogSortChevron>
                    <ChevronDown aria-hidden />
                  </BlogSortChevron>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup
                      value={blogListDirection}
                      onValueChange={(v) => {
                        if (v === "asc" || v === "desc") {
                          setBlogListDirection(v);
                        }
                      }}
                    >
                      {blogPinListDirectionOptions(blogListOrder).map(
                        (option) => (
                          <DropdownMenuRadioItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </DropdownMenuRadioItem>
                        ),
                      )}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              .
            </BlogLead>
          </BlogHeader>

          {visible.length === 0 ? (
            <FloatingPanel>
              <BlogEmptyPanel>
                <PageMuted>
                  {pins.length === 0
                    ? "No pins yet — add one from the toolbar."
                    : "No pins match the current filters."}
                </PageMuted>
              </BlogEmptyPanel>
            </FloatingPanel>
          ) : (
            <BlogPinList>
              {orderedVisible.map((t) => {
                const tagRows = (t.pin_tags ?? [])
                  .map((tt) => tt.tags)
                  .filter(Boolean) as {
                  id: string;
                  name: string;
                  color: string;
                  icon_emoji: string;
                }[];
                const pinPhotos = photosByPinId.get(t.id) ?? [];
                const galleryItems = photosToGalleryItems(
                  pinPhotos,
                  signedUrlByPhotoId,
                );
                const photoPlaceholders = pinPhotoGalleryPlaceholderCount(
                  pinPhotos,
                  galleryItems,
                );
                const detailHref = blogMapRoute
                  ? pinDetailHref(blogMapRoute, t.slug)
                  : "#";
                return (
                  <li key={t.id}>
                    <article>
                      {t.date ? (
                        <BlogPinDate dateTime={t.date}>
                          {formatPinDateRange(t.date, t.end_date)}
                        </BlogPinDate>
                      ) : null}
                      <BlogPinTitle spaced={Boolean(t.date)}>
                        <BlogPinTitleLink to={detailHref}>
                          {t.title?.trim() || "Untitled pin"}
                        </BlogPinTitleLink>
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
                              <span>{tag.icon_emoji}</span>
                              {tag.name}
                            </TagBadge>
                          ))}
                        </BlogTagRow>
                      ) : null}
                      {t.description?.trim() ? (
                        <BlogPinDescription markdown={t.description.trim()} />
                      ) : null}
                      {pinPhotos.length > 0 || photoPlaceholders > 0 ? (
                        <BlogPinGallery>
                          <PinPhotoGallery
                            items={galleryItems}
                            loadingPlaceholders={photoPlaceholders}
                            onOpen={(photoId) =>
                              setPhotoLightbox({
                                pinId: t.id,
                                photoId,
                              })
                            }
                          />
                        </BlogPinGallery>
                      ) : null}
                      <BlogPinActions>
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
                          View pin
                        </Button>
                      </BlogPinActions>
                    </article>
                  </li>
                );
              })}
            </BlogPinList>
          )}
        </BlogContent>
      </BlogScroll>

      <PinPhotoLightbox
        open={photoLightbox !== null}
        onOpenChange={(o) => {
          if (!o) setPhotoLightbox(null);
        }}
        items={blogLightboxItems}
        initialPhotoId={photoLightbox?.photoId ?? null}
        title={blogLightboxTitle}
      />

      <Dialog
        open={tagDialogOpen}
        onOpenChange={(open) => {
          setTagDialogOpen(open);
          if (!open) setTagEditTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tagEditTarget ? "Edit tag" : "New tag"}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogFormStack>
              <TagEntityLabelInput
                id="blog-tag-name"
                label="Tag"
                name={newTagName}
                onNameChange={setNewTagName}
                placeholder="Tag name"
                color={newTagColor}
                onColorChange={setNewTagColor}
                emoji={newTagEmoji}
                onEmojiChange={setNewTagEmoji}
              />
            </DialogFormStack>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTagDialogOpen(false);
                setTagEditTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void saveTag()}>
              {tagEditTarget ? "Save tag" : "Create tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BlogPageRoot>
  );
}
