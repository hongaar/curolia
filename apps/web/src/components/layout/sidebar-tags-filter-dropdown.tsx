import type { SetStateAction } from "react";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import type { Tag } from "@/types/database";
import {
  JournalDropdownEditButton,
  NavigationSidebarIcon,
  SidebarCheckIcon,
  SidebarCheckSpacer,
  SidebarDropdownContent,
  SidebarDropdownMenuItem,
  SidebarDropdownRow,
  SidebarPickerChevron,
  SidebarPickerLabel,
  SidebarPickerTrigger,
  SidebarTagIconWrap,
  SidebarTagName,
} from "@curolia/ui/navigation-sidebar";
import { Check, ChevronDown, Pencil, Plus, Tag as TagIcon } from "lucide-react";

type SidebarTagsFilterDropdownProps = {
  tags: Tag[];
  filterTagIds: Set<string>;
  setFilterTagIds: (action: SetStateAction<Set<string>>) => void;
  onNewTag: () => void;
  onEditTag: (tag: Tag) => void;
};

export function SidebarTagsFilterDropdown({
  tags,
  filterTagIds,
  setFilterTagIds,
  onNewTag,
  onEditTag,
}: SidebarTagsFilterDropdownProps) {
  return (
    <DropdownMenu>
      <SidebarPickerTrigger active={filterTagIds.size > 0}>
        <SidebarPickerLabel
          emoji={
            <SidebarTagIconWrap active={filterTagIds.size > 0}>
              <NavigationSidebarIcon>
                <TagIcon aria-hidden />
              </NavigationSidebarIcon>
            </SidebarTagIconWrap>
          }
        >
          Tags
        </SidebarPickerLabel>
        <SidebarPickerChevron>
          <ChevronDown aria-hidden />
        </SidebarPickerChevron>
      </SidebarPickerTrigger>
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
                  <JournalDropdownEditButton
                    title="Edit tag"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEditTag(tag);
                    }}
                  >
                    <Pencil aria-hidden />
                  </JournalDropdownEditButton>
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
      </SidebarDropdownContent>
    </DropdownMenu>
  );
}
