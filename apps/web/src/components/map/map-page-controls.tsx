import { MapControlsToolbar } from "@/components/map/map-controls-toolbar";
import { MapSecondaryToolbar } from "@/components/map/map-secondary-toolbar";
import { MapTagFiltersControl } from "@/components/map/map-tag-filters-control";
import type { PinMapHandle } from "@/components/map/pin-map";
import { PublicMapOwnerCard } from "@/components/map/public-map-owner-card";
import type { PublicMapOwnerProfile } from "@/hooks/use-public-map-owner-profile";
import type { ExploreCategoryId } from "@/lib/explore-categories";
import type { Tag } from "@/types/database";
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
  ownerProfile,
  activeRelocatePinId,
  tags,
  filterTagIds,
  setFilterTagIds,
  onNewTag,
  onEditTag,
  canEdit,
  isOwner,
  publicView,
  quickSettingsOpen,
  onQuickSettingsClick,
  exploreExpanded,
  exploreActiveCategories,
  exploreFocusedCategoryId,
  onToggleExploreExpanded,
  onToggleExploreCategory,
  onSelectExploreCategory,
  variant = "map",
}: {
  mapRef?: RefObject<PinMapHandle | null>;
  showOwnerCard?: boolean;
  ownerProfile?: PublicMapOwnerProfile | null;
  activeRelocatePinId?: string | null;
  tags: Tag[];
  filterTagIds: Set<string>;
  setFilterTagIds: (value: SetStateAction<Set<string>>) => void;
  onNewTag?: () => void;
  onEditTag: (tag: Tag) => void;
  canEdit: boolean;
  isOwner?: boolean;
  publicView?: boolean;
  quickSettingsOpen?: boolean;
  onQuickSettingsClick?: () => void;
  exploreExpanded: boolean;
  exploreActiveCategories: readonly ExploreCategoryId[];
  exploreFocusedCategoryId: ExploreCategoryId | null;
  onToggleExploreExpanded: () => void;
  onToggleExploreCategory: (categoryId: ExploreCategoryId) => void;
  onSelectExploreCategory: (categoryId: ExploreCategoryId) => void;
  variant?: "map" | "content";
}) {
  const isMapVariant = variant === "map";
  const isContentVariant = variant === "content";

  return (
    <MapControlsLayer>
      {isContentVariant ? (
        <MapControlsBottomCenter>
          <MapSecondaryToolbar
            placement="bottom-center"
            activeCategories={exploreActiveCategories}
            focusedCategoryId={exploreFocusedCategoryId}
            exploreExpanded={exploreExpanded}
            onToggleExploreExpanded={onToggleExploreExpanded}
            onToggleCategory={onToggleExploreCategory}
            onSelectCategory={onSelectExploreCategory}
          />
        </MapControlsBottomCenter>
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
              showQuickSettings={
                isMapVariant && Boolean(isOwner) && !publicView
              }
              quickSettingsOpen={quickSettingsOpen}
              onQuickSettingsClick={onQuickSettingsClick}
            />
            {isMapVariant && showOwnerCard && ownerProfile ? (
              <PublicMapOwnerCard
                profile={ownerProfile}
                surface="floating"
                showBio={false}
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
