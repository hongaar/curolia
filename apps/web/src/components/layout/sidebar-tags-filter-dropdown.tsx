import type { Tag } from "@/types/database";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import {
  MapDropdownEditButton,
  NavigationSidebarIcon,
  SidebarCheckIcon,
  SidebarCheckSpacer,
  SidebarDropdownContent,
  SidebarDropdownMenuItem,
  SidebarDropdownRow,
  SidebarPickerTrigger,
  SidebarTagIconWrap,
  SidebarTagName,
} from "@curolia/ui/navigation-sidebar";
import { Check, Pencil, Plus, Tag as TagIcon } from "lucide-react";
import { useState, type SetStateAction } from "react";

type SidebarTagsFilterDropdownProps = {
  tags: Tag[];
  filterTagIds: Set<string>;
  setFilterTagIds: (action: SetStateAction<Set<string>>) => void;
  onNewTag?: () => void;
  onEditTag?: (tag: Tag) => void;
};

export function SidebarTagsFilterDropdown({
  tags,
  filterTagIds,
  setFilterTagIds,
  onNewTag,
  onEditTag,
}: SidebarTagsFilterDropdownProps) {
  const canEdit = Boolean(onNewTag && onEditTag);
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <SidebarPickerTrigger
        active={filterTagIds.size > 0}
        icon={
          <SidebarTagIconWrap active={filterTagIds.size > 0}>
            <NavigationSidebarIcon>
              <TagIcon aria-hidden />
            </NavigationSidebarIcon>
          </SidebarTagIconWrap>
        }
        label="Tags"
      />
      <SidebarDropdownContent side="bottom" align="start" sideOffset={6}>
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
                  {canEdit ? (
                    <MapDropdownEditButton
                      title="Edit tag"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditTag?.(tag);
                        setOpen(false);
                      }}
                    >
                      <Pencil aria-hidden />
                    </MapDropdownEditButton>
                  ) : null}
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
        {canEdit ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNewTag?.()}>
              <Plus aria-hidden />
              New tag…
            </DropdownMenuItem>
          </>
        ) : null}
      </SidebarDropdownContent>
    </DropdownMenu>
  );
}
