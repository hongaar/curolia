import { FloatingPanel } from "@/components/layout/floating-panel";
import { MapViewInitialLoader } from "@/components/layout/map-view-initial-loader";
import { AddPinFab } from "@/components/pins/add-pin-fab";
import { EmojiPicker } from "@/components/pins/emoji-picker";
import { PresetColorPicker } from "@/components/pins/preset-color-picker";
import { useBlogPinListOrder } from "@/hooks/use-blog-pin-list-order";
import { mapAddPinHref } from "@/lib/app-paths";
import { orderedBlogPinList } from "@/lib/blog-pin-list-order";
import { formatPinDateRange } from "@/lib/pin-dates";
import { photosToLightboxItems } from "@/lib/pin-photo-lightbox-items";
import { filterPinsByTags, type PinWithTags } from "@/lib/pin-with-tags";
import { DEFAULT_PIN_TAG_COLOR } from "@/lib/preset-pin-tag-colors";
import { supabase } from "@/lib/supabase";
import { useMapPinsPhotosSignedUrls } from "@/lib/use-pin-photos";
import { useMap } from "@/providers/map-provider";
import { useMountTagSidebarRegistration } from "@/providers/tag-sidebar-provider";
import type { Tag } from "@/types/database";
import { contrastingForeground } from "@curolia/ui";
import {
  BlogContent,
  BlogEmptyPanel,
  BlogFabSlot,
  BlogHeader,
  BlogKicker,
  BlogLead,
  BlogPageRoot,
  BlogPhotoCell,
  BlogPhotoGrid,
  BlogPhotoSkeleton,
  BlogPinActions,
  BlogPinDate,
  BlogPinDescription,
  BlogPinList,
  BlogPinTitle,
  BlogPinTitleLink,
  BlogScroll,
  BlogSortChevron,
  BlogSortTrigger,
  BlogTagBadge,
  BlogTagRow,
  BlogTitle,
} from "@curolia/ui/blog";
import { Button } from "@curolia/ui/button";
import { Dialog, DialogFooter, DialogHeader } from "@curolia/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@curolia/ui/dropdown-menu";
import { Input } from "@curolia/ui/input";
import { Label } from "@curolia/ui/label";
import { PageMuted } from "@curolia/ui/page";
import {
  PanelDialogContent,
  PanelDialogField,
  PanelDialogFormStack,
  PanelDialogTitle,
} from "@curolia/ui/panel-dialog";
import {
  PinPhotoLightbox,
  PinPhotoThumb,
} from "@curolia/ui/pin-photo-lightbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useCallback, useMemo, useState, type SetStateAction } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useMapSlugRouteSync } from "@/hooks/use-map-slug-route-sync";
import { pinDetailHref } from "@/lib/app-paths";
import {
  applyFilterTagsToSearchParams,
  resolveFilterTagIdsFromSearchParams,
} from "@/lib/map-view-params";

export function BlogPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { mapSlug } = useParams<{ mapSlug: string }>();
  useMapSlugRouteSync(mapSlug);
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeMapId, activeMap, loading: mapLoading } = useMap();
  const { order: blogListOrder, setOrder: setBlogListOrder } =
    useBlogPinListOrder(activeMapId);

  const blogMapSlug = mapSlug?.trim() || activeMap?.slug?.trim() || "";
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

  useMountTagSidebarRegistration({
    tags,
    filterTagIds,
    setFilterTagIds,
    onNewTag: () => {
      setTagEditTarget(null);
      setNewTagName("");
      setNewTagColor(DEFAULT_PIN_TAG_COLOR);
      setNewTagEmoji("📍");
      setTagDialogOpen(true);
    },
    onEditTag: (tag) => {
      setTagEditTarget(tag);
      setNewTagName(tag.name);
      setNewTagColor(tag.color);
      setNewTagEmoji(tag.icon_emoji || "📍");
      setTagDialogOpen(true);
    },
  });

  const pins = useMemo(() => pinsQuery.data ?? [], [pinsQuery.data]);
  const visible = useMemo(
    () => filterPinsByTags(pins, filterTagIds),
    [pins, filterTagIds],
  );
  const orderedVisible = useMemo(
    () => orderedBlogPinList(visible, blogListOrder),
    [visible, blogListOrder],
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

  if (mapLoading || (Boolean(activeMapId) && pinsQuery.isPending)) {
    return <MapViewInitialLoader />;
  }

  if (!activeMapId) {
    return <MapViewInitialLoader label="No map available." busy={false} />;
  }

  return (
    <BlogPageRoot>
      <BlogFabSlot>
        <AddPinFab
          onClick={() => {
            if (!blogMapSlug) return;
            navigate(mapAddPinHref(blogMapSlug, searchParams));
          }}
        />
      </BlogFabSlot>

      <BlogScroll>
        <BlogContent>
          <BlogHeader>
            <BlogKicker>Map</BlogKicker>
            <BlogTitle>{activeMap?.name.trim() || mapSlug || "Map"}</BlogTitle>
            <BlogLead>
              Pins are listed in{" "}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <BlogSortTrigger
                      aria-label={
                        blogListOrder === "chronological"
                          ? "Pin list order: chronological — change sorting"
                          : "Pin list order: alphabetical — change sorting"
                      }
                    />
                  }
                >
                  {blogListOrder === "chronological"
                    ? "chronological order"
                    : "alphabetical order"}
                  <BlogSortChevron>
                    <ChevronDown aria-hidden />
                  </BlogSortChevron>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>List order</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={blogListOrder}
                      onValueChange={(v) => {
                        if (v === "chronological" || v === "alphabetical") {
                          setBlogListOrder(v);
                        }
                      }}
                    >
                      <DropdownMenuRadioItem value="chronological">
                        Chronological
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="alphabetical">
                        Alphabetical (by title)
                      </DropdownMenuRadioItem>
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
                const detailHref = blogMapSlug
                  ? pinDetailHref(blogMapSlug, t.slug)
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
                            <BlogTagBadge
                              key={tag.id}
                              style={{
                                backgroundColor: tag.color,
                                color: contrastingForeground(tag.color),
                              }}
                            >
                              <span>{tag.icon_emoji}</span>
                              {tag.name}
                            </BlogTagBadge>
                          ))}
                        </BlogTagRow>
                      ) : null}
                      {t.description?.trim() ? (
                        <BlogPinDescription>
                          {t.description.trim()}
                        </BlogPinDescription>
                      ) : null}
                      {pinPhotos.length > 0 ? (
                        <BlogPhotoGrid>
                          {pinPhotos.map((p) => {
                            const url = signedUrlByPhotoId[p.id];
                            return url ? (
                              <BlogPhotoCell key={p.id}>
                                <PinPhotoThumb
                                  url={url}
                                  size="square"
                                  onOpen={() =>
                                    setPhotoLightbox({
                                      pinId: t.id,
                                      photoId: p.id,
                                    })
                                  }
                                />
                              </BlogPhotoCell>
                            ) : (
                              <BlogPhotoSkeleton key={p.id} />
                            );
                          })}
                        </BlogPhotoGrid>
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
        <PanelDialogContent>
          <DialogHeader>
            <PanelDialogTitle>
              {tagEditTarget ? "Edit tag" : "New tag"}
            </PanelDialogTitle>
          </DialogHeader>
          <PanelDialogFormStack>
            <PanelDialogField>
              <Label htmlFor="blog-tag-name">Name</Label>
              <Input
                id="blog-tag-name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </PanelDialogField>
            <PresetColorPicker
              id="blog-tag-color"
              label="Color"
              value={newTagColor}
              onChange={setNewTagColor}
            />
            <EmojiPicker
              id="blog-tag-emoji"
              label="Icon (emoji)"
              value={newTagEmoji}
              onChange={setNewTagEmoji}
            />
          </PanelDialogFormStack>
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
        </PanelDialogContent>
      </Dialog>
    </BlogPageRoot>
  );
}
