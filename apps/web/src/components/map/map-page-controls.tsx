import { MapControlsToolbar } from "@/components/map/map-controls-toolbar";
import { MapSecondaryToolbar } from "@/components/map/map-secondary-toolbar";
import { MapTagFiltersControl } from "@/components/map/map-tag-filters-control";
import type { PinMapHandle } from "@/components/map/pin-map";
import { PublicMapOwnerCard } from "@/components/map/public-map-owner-card";
import { useMaxSm } from "@/hooks/use-max-sm";
import type { PublicMapOwnerProfile } from "@/hooks/use-public-map-owner-profile";
import type { ExploreCategoryId } from "@/lib/explore-categories";
import type { ExploreViewport } from "@/lib/explore-results";
import type { Tag } from "@/types/database";
import type { ExploreResultEntry } from "@curolia/plugin-contract";
import {
  MapControlsBottomCenter,
  MapControlsBottomStack,
  MapControlsLayer,
  MapControlsTopLeftStack,
  MapPlacementHint,
} from "@curolia/ui/map";
import type { RefObject, SetStateAction } from "react";

export function MapPageControls({
  mapRef,
  showOwnerCard,
  ownerCardHidden = false,
  ownerProfile,
  activeRelocatePinId,
  tags,
  filterTagIds,
  setFilterTagIds,
  onNewTag,
  onEditTag,
  canEdit,
  exploreExpanded,
  exploreActiveCategories,
  exploreFocusedCategoryId,
  onToggleExploreExpanded,
  onToggleExploreCategory,
  onSelectExploreCategory,
  exploreViewport,
  exploreEntries,
  exploreResultsFetching,
  onGenerateExploreRoutes,
  onSelectExploreEntry,
  isOwner,
  publicView,
  quickSettingsOpen,
  onQuickSettingsClick,
  variant = "map",
}: {
  mapRef?: RefObject<PinMapHandle | null>;
  showOwnerCard?: boolean;
  /** Slides the owner card out (e.g. while a blog/gallery panel shows its own author section). */
  ownerCardHidden?: boolean;
  ownerProfile?: PublicMapOwnerProfile | null;
  activeRelocatePinId?: string | null;
  tags: Tag[];
  filterTagIds: Set<string>;
  setFilterTagIds: (value: SetStateAction<Set<string>>) => void;
  onNewTag?: () => void;
  onEditTag: (tag: Tag) => void;
  canEdit: boolean;
  exploreExpanded: boolean;
  exploreActiveCategories: readonly ExploreCategoryId[];
  exploreFocusedCategoryId: ExploreCategoryId | null;
  onToggleExploreExpanded: () => void;
  onToggleExploreCategory: (categoryId: ExploreCategoryId) => void;
  onSelectExploreCategory: (categoryId: ExploreCategoryId) => void;
  exploreViewport?: ExploreViewport | null;
  exploreEntries?: readonly ExploreResultEntry[];
  exploreResultsFetching?: boolean;
  onGenerateExploreRoutes?: () => void;
  onSelectExploreEntry?: (entry: ExploreResultEntry) => void;
  isOwner?: boolean;
  publicView?: boolean;
  quickSettingsOpen?: boolean;
  onQuickSettingsClick?: () => void;
  variant?: "map" | "content";
}) {
  const isMapVariant = variant === "map";
  const isContentVariant = variant === "content";
  const isMobile = useMaxSm();
  // On mobile the picker and view switcher live in the app toolbar
  // (persistent across map/blog/gallery), so they never move between views.

  return (
    <MapControlsLayer>
      {isContentVariant ? (
        isMobile ? null : (
          <MapControlsBottomCenter>
            <MapSecondaryToolbar
              placement="bottom-center"
              activeCategories={exploreActiveCategories}
              focusedCategoryId={exploreFocusedCategoryId}
              exploreExpanded={exploreExpanded}
              onToggleExploreExpanded={onToggleExploreExpanded}
              onToggleCategory={onToggleExploreCategory}
              onSelectCategory={onSelectExploreCategory}
              exploreViewport={exploreViewport}
              exploreEntries={exploreEntries}
              exploreResultsFetching={exploreResultsFetching}
              onGenerateExploreRoutes={onGenerateExploreRoutes}
              onSelectExploreEntry={onSelectExploreEntry}
            />
          </MapControlsBottomCenter>
        )
      ) : (
        <>
          <MapControlsTopLeftStack>
            <MapSecondaryToolbar
              placement="top-left"
              activeCategories={exploreActiveCategories}
              focusedCategoryId={exploreFocusedCategoryId}
              exploreExpanded={exploreExpanded}
              onToggleExploreExpanded={onToggleExploreExpanded}
              onToggleCategory={onToggleExploreCategory}
              onSelectCategory={onSelectExploreCategory}
              exploreViewport={exploreViewport}
              exploreEntries={exploreEntries}
              exploreResultsFetching={exploreResultsFetching}
              onGenerateExploreRoutes={onGenerateExploreRoutes}
              onSelectExploreEntry={onSelectExploreEntry}
              showNav={!isMobile}
              showQuickSettings={
                !isMobile && isMapVariant && Boolean(isOwner) && !publicView
              }
              quickSettingsOpen={quickSettingsOpen}
              onQuickSettingsClick={onQuickSettingsClick}
            />
            {isMapVariant && showOwnerCard && ownerProfile ? (
              <PublicMapOwnerCard
                profile={ownerProfile}
                surface="floating"
                showBio={false}
                hidden={ownerCardHidden}
              />
            ) : null}
          </MapControlsTopLeftStack>

          {activeRelocatePinId ? (
            <MapControlsBottomCenter>
              <MapPlacementHint>
                Click the map to move this pin · Esc to cancel
              </MapPlacementHint>
            </MapControlsBottomCenter>
          ) : null}
        </>
      )}

      <MapControlsBottomStack>
        <MapTagFiltersControl
          tags={tags}
          filterTagIds={filterTagIds}
          setFilterTagIds={setFilterTagIds}
          onNewTag={onNewTag}
          onEditTag={onEditTag}
          canEdit={canEdit}
        />
        {isMapVariant && mapRef ? <MapControlsToolbar mapRef={mapRef} /> : null}
      </MapControlsBottomStack>
    </MapControlsLayer>
  );
}
