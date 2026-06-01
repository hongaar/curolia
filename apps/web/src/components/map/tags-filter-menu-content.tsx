import type { Tag } from "@/types/database";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import {
  MapDropdownEditButton,
  SidebarCheckIcon,
  SidebarCheckSpacer,
  SidebarDropdownMenuItem,
  SidebarDropdownRow,
  SidebarTagName,
} from "@curolia/ui/navigation-sidebar";
import { Check, Pencil, Plus } from "lucide-react";
import type { SetStateAction } from "react";

type TagsFilterMenuContentProps = {
  tags: Tag[];
  filterTagIds: Set<string>;
  setFilterTagIds: (action: SetStateAction<Set<string>>) => void;
  onNewTag: () => void;
  onEditTag: (tag: Tag) => void;
};

export function TagsFilterMenuContent({
  tags,
  filterTagIds,
  setFilterTagIds,
  onNewTag,
  onEditTag,
}: TagsFilterMenuContentProps) {
  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>Tags</DropdownMenuLabel>
        {tags.length === 0 ? (
          <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
        ) : (
          tags.map((tag) => {
            const selected = filterTagIds.has(tag.id);
            return (
              <SidebarDropdownRow key={tag.id}>
                <SidebarDropdownMenuItem
                  closeOnClick={false}
                  onClick={() => {
                    setFilterTagIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(tag.id)) next.delete(tag.id);
                      else next.add(tag.id);
                      return next;
                    });
                  }}
                >
                  <span aria-hidden>{tag.icon_emoji}</span>
                  <SidebarTagName selected={selected}>
                    {tag.name}
                  </SidebarTagName>
                  {selected ? (
                    <SidebarCheckIcon>
                      <Check aria-hidden />
                    </SidebarCheckIcon>
                  ) : (
                    <SidebarCheckSpacer />
                  )}
                </SidebarDropdownMenuItem>
                <MapDropdownEditButton
                  title="Edit tag"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEditTag(tag);
                  }}
                >
                  <Pencil aria-hidden />
                </MapDropdownEditButton>
              </SidebarDropdownRow>
            );
          })
        )}
      </DropdownMenuGroup>
      {filterTagIds.size > 0 ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setFilterTagIds(new Set());
            }}
          >
            Clear filters
          </DropdownMenuItem>
        </>
      ) : null}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onNewTag()}>
        <Plus aria-hidden />
        New tag…
      </DropdownMenuItem>
    </>
  );
}
