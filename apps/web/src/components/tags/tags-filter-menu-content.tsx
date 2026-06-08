import type { Tag } from "@/types/database";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import {
  DropdownMenuCheckIcon,
  DropdownMenuCheckItem,
  DropdownMenuCheckSpacer,
  DropdownMenuEditButton,
  DropdownMenuEditRow,
  DropdownMenuItemName,
} from "@curolia/ui/dropdown-menu-list";
import { Check, Pencil, Plus } from "lucide-react";
import type { SetStateAction } from "react";

type TagsFilterMenuContentProps = {
  tags: Tag[];
  filterTagIds: Set<string>;
  setFilterTagIds: (action: SetStateAction<Set<string>>) => void;
  onNewTag?: () => void;
  onEditTag?: (tag: Tag) => void;
  canEdit?: boolean;
};

export function TagsFilterMenuContent({
  tags,
  filterTagIds,
  setFilterTagIds,
  onNewTag,
  onEditTag,
  canEdit = true,
}: TagsFilterMenuContentProps) {
  return (
    <>
      {filterTagIds.size > 0 ? (
        <>
          <DropdownMenuItem
            onClick={() => {
              setFilterTagIds(new Set());
            }}
          >
            Clear filters
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      ) : null}
      <DropdownMenuGroup>
        <DropdownMenuLabel>Tags</DropdownMenuLabel>
        {tags.length === 0 ? (
          <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
        ) : (
          tags.map((tag) => {
            const selected = filterTagIds.has(tag.id);
            return (
              <DropdownMenuEditRow key={tag.id}>
                <DropdownMenuCheckItem
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
                  <DropdownMenuItemName selected={selected}>
                    {tag.name}
                  </DropdownMenuItemName>
                  {selected ? (
                    <DropdownMenuCheckIcon>
                      <Check aria-hidden />
                    </DropdownMenuCheckIcon>
                  ) : (
                    <DropdownMenuCheckSpacer />
                  )}
                </DropdownMenuCheckItem>
                {canEdit ? (
                  <DropdownMenuEditButton
                    title="Edit tag"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEditTag?.(tag);
                    }}
                  >
                    <Pencil aria-hidden />
                  </DropdownMenuEditButton>
                ) : null}
              </DropdownMenuEditRow>
            );
          })
        )}
      </DropdownMenuGroup>
      {onNewTag ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onNewTag()}>
            <Plus aria-hidden />
            New tag…
          </DropdownMenuItem>
        </>
      ) : null}
    </>
  );
}
