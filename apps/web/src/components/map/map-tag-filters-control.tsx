import { TagsFilterMenuContent } from "@/components/map/tags-filter-menu-content";
import type { Tag } from "@/types/database";
import { DropdownMenu, DropdownMenuContent } from "@curolia/ui/dropdown-menu";
import { MapToolbarMenuTrigger } from "@curolia/ui/map-toolbar";
import { Tag as TagIcon } from "lucide-react";
import type { SetStateAction } from "react";

type MapTagFiltersControlProps = {
  tags: Tag[];
  filterTagIds: Set<string>;
  setFilterTagIds: (action: SetStateAction<Set<string>>) => void;
  onNewTag: () => void;
  onEditTag: (tag: Tag) => void;
};

export function MapTagFiltersControl({
  tags,
  filterTagIds,
  setFilterTagIds,
  onNewTag,
  onEditTag,
}: MapTagFiltersControlProps) {
  const activeCount = filterTagIds.size;

  return (
    <DropdownMenu>
      <MapToolbarMenuTrigger
        icon={<TagIcon aria-hidden />}
        label="Tag filters"
        title="Filter pins by tag"
        active={activeCount > 0}
        badgeCount={activeCount}
      />
      <DropdownMenuContent align="end" side="top" sideOffset={8}>
        <TagsFilterMenuContent
          tags={tags}
          filterTagIds={filterTagIds}
          setFilterTagIds={setFilterTagIds}
          onNewTag={onNewTag}
          onEditTag={onEditTag}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
