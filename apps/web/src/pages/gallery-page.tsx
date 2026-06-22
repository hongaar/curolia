import { MapViewInitialLoader } from "@/components/layout/map-view-initial-loader";
import { MapGalleryPanel } from "@/components/map/map-gallery-panel";
import { MapPageControls } from "@/components/map/map-page-controls";
import { MapSlugAccessBlocked } from "@/components/map/map-slug-access-blocked";
import { TagEntityLabelInput } from "@/components/pins/tag-entity-label-input";
import { useExplore } from "@/hooks/use-explore";
import { useMapMemberRole } from "@/hooks/use-map-access";
import { useMapSlugRouteSync } from "@/hooks/use-map-slug-route-sync";
import { useMapViewAccess } from "@/hooks/use-map-view-access";
import { usePublicMapCrawlerBlockMeta } from "@/hooks/use-public-map-crawler-block-meta";
import { DEFAULT_PIN_TAG_COLOR } from "@/lib/preset-pin-tag-colors";
import { supabase } from "@/lib/supabase";
import { useMap } from "@/providers/map-provider";
import type { Tag } from "@/types/database";
import { BlogPageRoot } from "@curolia/ui/blog";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState, type SetStateAction } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import {
  applyFilterTagsToSearchParams,
  resolveFilterTagIdsFromSearchParams,
} from "@/lib/map-view-params";

export function GalleryPage() {
  const qc = useQueryClient();
  const { profileSlug, mapSlug } = useParams<{
    profileSlug: string;
    mapSlug: string;
  }>();
  useMapSlugRouteSync(profileSlug, mapSlug);
  useMapViewAccess();
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
  usePublicMapCrawlerBlockMeta(activeMap, publicView);
  const {
    expanded: exploreExpanded,
    activeCategories: exploreActiveCategories,
    focusedCategoryId: exploreFocusedCategoryId,
    toggleExpanded: toggleExploreExpanded,
    toggleCategory: toggleExploreCategory,
    selectCategory: selectExploreCategory,
  } = useExplore();

  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagEditTarget, setTagEditTarget] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_PIN_TAG_COLOR);
  const [newTagEmoji, setNewTagEmoji] = useState("");

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

  const pinsQuery = useQuery({
    // Distinct from MapGalleryPanel's full pins query — same key would cache only `id`.
    queryKey: ["pins", activeMapId, "gallery", "probe"],
    queryFn: async () => {
      if (!activeMapId) return [];
      const { data, error } = await supabase
        .from("pins")
        .select("id")
        .eq("map_id", activeMapId)
        .limit(1);
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
    setNewTagEmoji(tag.icon_emoji ?? "");
    setTagDialogOpen(true);
  };

  async function saveTag() {
    if (!activeMapId || !newTagName.trim()) return;
    if (tagEditTarget) {
      const { error } = await supabase
        .from("tags")
        .update({
          name: newTagName.trim(),
          color: newTagColor,
          icon_emoji: newTagEmoji.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tagEditTarget.id);
      if (!error) {
        setTagDialogOpen(false);
        setTagEditTarget(null);
        await qc.invalidateQueries({ queryKey: ["tags", activeMapId] });
        await qc.invalidateQueries({
          queryKey: ["pins", activeMapId, "gallery"],
        });
      }
      return;
    }
    const { error } = await supabase.from("tags").insert({
      map_id: activeMapId,
      name: newTagName.trim(),
      color: newTagColor,
      icon_emoji: newTagEmoji.trim() || null,
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
      <MapPageControls
        variant="content"
        tags={tags}
        filterTagIds={filterTagIds}
        setFilterTagIds={setFilterTagIds}
        onEditTag={openEditTagDialog}
        canEdit={canEdit}
        exploreExpanded={exploreExpanded}
        exploreActiveCategories={exploreActiveCategories}
        exploreFocusedCategoryId={exploreFocusedCategoryId}
        onToggleExploreExpanded={toggleExploreExpanded}
        onToggleExploreCategory={toggleExploreCategory}
        onSelectExploreCategory={selectExploreCategory}
      />

      <MapGalleryPanel mapSlug={mapSlug} gridColumns={4} />

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
                id="gallery-tag-name"
                label="Tag"
                name={newTagName}
                onNameChange={setNewTagName}
                placeholder="Tag name"
                color={newTagColor}
                onColorChange={setNewTagColor}
                emoji={newTagEmoji}
                onEmojiChange={setNewTagEmoji}
                emojiClearable
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
