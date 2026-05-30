import { FloatingPanel } from "@/components/layout/floating-panel";
import { JournalViewInitialLoader } from "@/components/layout/journal-view-initial-loader";
import { AddTraceFab } from "@/components/traces/add-trace-fab";
import { EmojiPicker } from "@/components/traces/emoji-picker";
import { PresetColorPicker } from "@/components/traces/preset-color-picker";
import { TraceFormDialog } from "@/components/traces/trace-form-dialog";
import { useBlogTraceListOrder } from "@/hooks/use-blog-trace-list-order";
import { orderedBlogTraceList } from "@/lib/blog-trace-list-order";
import { DEFAULT_TRACE_TAG_COLOR } from "@/lib/preset-trace-tag-colors";
import { supabase } from "@/lib/supabase";
import { formatTraceDateRange } from "@/lib/trace-dates";
import { photosToLightboxItems } from "@/lib/trace-photo-lightbox-items";
import { filterTracesByTags, type TraceWithTags } from "@/lib/trace-with-tags";
import { useJournalTracesPhotosSignedUrls } from "@/lib/use-trace-photos";
import { contrastingForeground } from "@curolia/ui";
import { useJournal } from "@/providers/journal-provider";
import { useMountTagSidebarRegistration } from "@/providers/tag-sidebar-provider";
import type { Tag } from "@/types/database";
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
  BlogScroll,
  BlogSortChevron,
  BlogSortTrigger,
  BlogTagBadge,
  BlogTagRow,
  BlogTitle,
  BlogTraceActions,
  BlogTraceDate,
  BlogTraceDescription,
  BlogTraceList,
  BlogTraceTitle,
  BlogTraceTitleLink,
} from "@curolia/ui/curolia/blog-ui";
import { PageMuted } from "@curolia/ui/curolia/page";
import {
  PanelDialogContent,
  PanelDialogField,
  PanelDialogFormStack,
  PanelDialogTitle,
} from "@curolia/ui/curolia/panel-dialog";
import {
  TracePhotoLightbox,
  TracePhotoThumb,
} from "@curolia/ui/curolia/trace-photo-lightbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useCallback, useMemo, useState, type SetStateAction } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useJournalSlugRouteSync } from "@/hooks/use-journal-slug-route-sync";
import { traceDetailHref } from "@/lib/app-paths";
import {
  applyFilterTagsToSearchParams,
  resolveFilterTagIdsFromSearchParams,
} from "@/lib/map-view-params";

export function BlogPage() {
  const qc = useQueryClient();
  const { journalSlug } = useParams<{ journalSlug: string }>();
  useJournalSlugRouteSync(journalSlug);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    activeJournalId,
    activeJournal,
    loading: journalLoading,
  } = useJournal();
  const { order: blogListOrder, setOrder: setBlogListOrder } =
    useBlogTraceListOrder(activeJournalId);

  const blogJournalSlug =
    journalSlug?.trim() || activeJournal?.slug?.trim() || "";
  const [formOpen, setFormOpen] = useState(false);
  const [photoLightbox, setPhotoLightbox] = useState<{
    traceId: string;
    photoId: string;
  } | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditTarget, setTagEditTarget] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TRACE_TAG_COLOR);
  const [newTagEmoji, setNewTagEmoji] = useState("📍");
  const tracesQuery = useQuery({
    queryKey: ["traces", activeJournalId, "blog"],
    queryFn: async () => {
      if (!activeJournalId) return [];
      const { data, error } = await supabase
        .from("traces")
        .select(
          `*,
          trace_tags ( tag_id, tags ( id, name, color, icon_emoji ) )`,
        )
        .eq("journal_id", activeJournalId)
        .order("date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as TraceWithTags[];
    },
    enabled: Boolean(activeJournalId) && !journalLoading,
  });

  const tagsQuery = useQuery({
    queryKey: ["tags", activeJournalId],
    queryFn: async () => {
      if (!activeJournalId) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("journal_id", activeJournalId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(activeJournalId) && !journalLoading,
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
      setNewTagColor(DEFAULT_TRACE_TAG_COLOR);
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

  const traces = useMemo(() => tracesQuery.data ?? [], [tracesQuery.data]);
  const visible = useMemo(
    () => filterTracesByTags(traces, filterTagIds),
    [traces, filterTagIds],
  );
  const orderedVisible = useMemo(
    () => orderedBlogTraceList(visible, blogListOrder),
    [visible, blogListOrder],
  );
  const visibleTraceIds = useMemo(
    () => orderedVisible.map((t) => t.id),
    [orderedVisible],
  );
  const { photosByTraceId, signedUrlByPhotoId } =
    useJournalTracesPhotosSignedUrls(
      activeJournalId ?? undefined,
      visibleTraceIds,
    );

  const blogLightboxItems = useMemo(() => {
    if (!photoLightbox) return [];
    const ps = photosByTraceId.get(photoLightbox.traceId) ?? [];
    return photosToLightboxItems(ps, signedUrlByPhotoId);
  }, [photoLightbox, photosByTraceId, signedUrlByPhotoId]);

  const blogLightboxTitle = useMemo(() => {
    if (!photoLightbox) return undefined;
    const t = orderedVisible.find((x) => x.id === photoLightbox.traceId);
    return t?.title?.trim() || "Untitled trace";
  }, [photoLightbox, orderedVisible]);

  const formDefaults = useMemo(() => {
    if (traces.length === 0) return { lat: 20, lng: 0 };
    const last = traces[traces.length - 1];
    return { lat: last.lat, lng: last.lng };
  }, [traces]);

  async function saveTag() {
    if (!activeJournalId || !newTagName.trim()) return;
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
        await qc.invalidateQueries({ queryKey: ["tags", activeJournalId] });
        await qc.invalidateQueries({
          queryKey: ["traces", activeJournalId, "blog"],
        });
      }
      return;
    }
    const { error } = await supabase.from("tags").insert({
      journal_id: activeJournalId,
      name: newTagName.trim(),
      color: newTagColor,
      icon_emoji: newTagEmoji || "📍",
    });
    if (!error) {
      setNewTagName("");
      setTagDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ["tags", activeJournalId] });
    }
  }

  if (journalLoading || (Boolean(activeJournalId) && tracesQuery.isPending)) {
    return <JournalViewInitialLoader />;
  }

  if (!activeJournalId) {
    return (
      <JournalViewInitialLoader label="No journal available." busy={false} />
    );
  }

  return (
    <BlogPageRoot>
      <BlogFabSlot>
        <AddTraceFab onClick={() => setFormOpen(true)} />
      </BlogFabSlot>

      <BlogScroll>
        <BlogContent>
          <BlogHeader>
            <BlogKicker>Journal</BlogKicker>
            <BlogTitle>
              {activeJournal?.name.trim() || journalSlug || "Journal"}
            </BlogTitle>
            <BlogLead>
              Traces are listed in{" "}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <BlogSortTrigger
                      aria-label={
                        blogListOrder === "chronological"
                          ? "Trace list order: chronological — change sorting"
                          : "Trace list order: alphabetical — change sorting"
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
                  {traces.length === 0
                    ? "No traces yet — add one from the toolbar."
                    : "No traces match the current filters."}
                </PageMuted>
              </BlogEmptyPanel>
            </FloatingPanel>
          ) : (
            <BlogTraceList>
              {orderedVisible.map((t) => {
                const tagRows = (t.trace_tags ?? [])
                  .map((tt) => tt.tags)
                  .filter(Boolean) as {
                  id: string;
                  name: string;
                  color: string;
                  icon_emoji: string;
                }[];
                const tracePhotos = photosByTraceId.get(t.id) ?? [];
                const detailHref = blogJournalSlug
                  ? traceDetailHref(blogJournalSlug, t.slug)
                  : "#";
                return (
                  <li key={t.id}>
                    <article>
                      {t.date ? (
                        <BlogTraceDate dateTime={t.date}>
                          {formatTraceDateRange(t.date, t.end_date)}
                        </BlogTraceDate>
                      ) : null}
                      <BlogTraceTitle spaced={Boolean(t.date)}>
                        <BlogTraceTitleLink to={detailHref}>
                          {t.title?.trim() || "Untitled trace"}
                        </BlogTraceTitleLink>
                      </BlogTraceTitle>
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
                        <BlogTraceDescription>
                          {t.description.trim()}
                        </BlogTraceDescription>
                      ) : null}
                      {tracePhotos.length > 0 ? (
                        <BlogPhotoGrid>
                          {tracePhotos.map((p) => {
                            const url = signedUrlByPhotoId[p.id];
                            return url ? (
                              <BlogPhotoCell key={p.id}>
                                <TracePhotoThumb
                                  url={url}
                                  size="square"
                                  onOpen={() =>
                                    setPhotoLightbox({
                                      traceId: t.id,
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
                      <BlogTraceActions>
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
                          View trace
                        </Button>
                      </BlogTraceActions>
                    </article>
                  </li>
                );
              })}
            </BlogTraceList>
          )}
        </BlogContent>
      </BlogScroll>

      <TracePhotoLightbox
        open={photoLightbox !== null}
        onOpenChange={(o) => {
          if (!o) setPhotoLightbox(null);
        }}
        items={blogLightboxItems}
        initialPhotoId={photoLightbox?.photoId ?? null}
        title={blogLightboxTitle}
      />

      <TraceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        journalId={activeJournalId}
        trace={null}
        defaultLat={formDefaults.lat}
        defaultLng={formDefaults.lng}
        anchorScreen={null}
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
