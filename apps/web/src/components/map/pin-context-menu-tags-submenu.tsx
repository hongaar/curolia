import type { Tag } from "@/types/database";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@curolia/ui/dropdown-menu";
import {
  SidebarCheckIcon,
  SidebarCheckSpacer,
  SidebarDropdownMenuItem,
  SidebarTagName,
} from "@curolia/ui/navigation-sidebar";
import { Check } from "lucide-react";

type PinContextMenuTagsSubmenuProps = {
  tags: Tag[];
  selectedTagIds: Set<string>;
  onToggleTag: (tagId: string, checked: boolean) => void;
  disabled?: boolean;
};

export function PinContextMenuTagsSubmenu({
  tags,
  selectedTagIds,
  onToggleTag,
  disabled = false,
}: PinContextMenuTagsSubmenuProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>Tags</DropdownMenuLabel>
      {tags.length === 0 ? (
        <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
      ) : (
        tags.map((tag) => {
          const selected = selectedTagIds.has(tag.id);
          return (
            <SidebarDropdownMenuItem
              key={tag.id}
              closeOnClick={false}
              disabled={disabled}
              onClick={() => onToggleTag(tag.id, !selected)}
            >
              <span aria-hidden>{tag.icon_emoji}</span>
              <SidebarTagName selected={selected}>{tag.name}</SidebarTagName>
              {selected ? (
                <SidebarCheckIcon>
                  <Check aria-hidden />
                </SidebarCheckIcon>
              ) : (
                <SidebarCheckSpacer />
              )}
            </SidebarDropdownMenuItem>
          );
        })
      )}
    </DropdownMenuGroup>
  );
}
