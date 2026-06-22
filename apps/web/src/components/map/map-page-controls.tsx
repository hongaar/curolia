import { MapControlsToolbar } from "@/components/map/map-controls-toolbar";
import { MapQuickSettingsTrigger } from "@/components/map/map-quick-settings-trigger";
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
  onToggleExploreExpanded,
  onToggleExploreCategory,
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
  onToggleExploreExpanded: () => void;
  onToggleExploreCategory: (categoryId: ExploreCategoryId) => void;
  variant?: "map" | "content";
}) {
  const isMapVariant = variant === "map";

  return (
    <MapControlsLayer>
      <MapControlsTopLeftStack>
        <MapSecondaryToolbar
          activeCategories={exploreActiveCategories}
          exploreExpanded={exploreExpanded}
          onToggleExploreExpanded={onToggleExploreExpanded}
          onToggleCategory={onToggleExploreCategory}
        />
        {isMapVariant && showOwnerCard && ownerProfile ? (
          <PublicMapOwnerCard
            profile={ownerProfile}
            surface="floating"
            showBio={false}
          />
        ) : null}
      </MapControlsTopLeftStack>

      <MapControlsBottomCenter>
        {isMapVariant && activeRelocatePinId ? (
          <MapPlacementHint>
            Click the map to move this pin · Esc to cancel
          </MapPlacementHint>
        ) : null}
      </MapControlsBottomCenter>

      <MapControlsBottomStack>
        <MapTagFiltersControl
          tags={tags}
          filterTagIds={filterTagIds}
          setFilterTagIds={setFilterTagIds}
          onNewTag={onNewTag}
          onEditTag={onEditTag}
          canEdit={canEdit}
        />
        {isMapVariant && isOwner && !publicView ? (
          <MapQuickSettingsTrigger
            open={Boolean(quickSettingsOpen)}
            onClick={onQuickSettingsClick ?? (() => undefined)}
          />
        ) : null}
        {isMapVariant && mapRef ? <MapControlsToolbar mapRef={mapRef} /> : null}
      </MapControlsBottomStack>
    </MapControlsLayer>
  );
}
