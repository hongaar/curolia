import type { Tag } from "@/types/database";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@curolia/ui/dropdown-menu";
import {
  DropdownMenuCheckIcon,
  DropdownMenuCheckItem,
  DropdownMenuCheckSpacer,
  DropdownMenuItemName,
} from "@curolia/ui/dropdown-menu-list";
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
            <DropdownMenuCheckItem
              key={tag.id}
              closeOnClick={false}
              disabled={disabled}
              onClick={() => onToggleTag(tag.id, !selected)}
            >
              <span aria-hidden>
                {tag.icon_emoji ? (
                  tag.icon_emoji
                ) : (
                  <span
                    style={{
                      display: "inline-block",
                      width: "0.75rem",
                      height: "0.75rem",
                      borderRadius: "999px",
                      backgroundColor: tag.color,
                    }}
                  />
                )}
              </span>
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
          );
        })
      )}
    </DropdownMenuGroup>
  );
}
