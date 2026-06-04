import { TagsFilterMenuContent } from "@/components/map/tags-filter-menu-content";
import type { Tag } from "@/types/database";
import { DropdownMenu, DropdownMenuContent } from "@curolia/ui/dropdown-menu";
import { MapToolbarMenuTrigger } from "@curolia/ui/map-toolbar";
import { Tag as TagIcon } from "lucide-react";
import { useState, type SetStateAction } from "react";

type MapTagFiltersControlProps = {
  tags: Tag[];
  filterTagIds: Set<string>;
  setFilterTagIds: (action: SetStateAction<Set<string>>) => void;
  onNewTag?: () => void;
  onEditTag: (tag: Tag) => void;
  canEdit?: boolean;
};

export function MapTagFiltersControl({
  tags,
  filterTagIds,
  setFilterTagIds,
  onNewTag,
  onEditTag,
  canEdit = true,
}: MapTagFiltersControlProps) {
  const activeCount = filterTagIds.size;
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
          onEditTag={(tag) => {
            onEditTag(tag);
            setOpen(false);
          }}
          canEdit={canEdit}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
