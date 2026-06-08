import type { Meta, StoryObj } from "@storybook/react";
import { Pencil, Trash2 } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import {
  DropdownMenuEditButton,
  DropdownMenuEditRow,
} from "./dropdown-menu-list";

const meta = {
  title: "Dropdown menu list",
  ...componentStoryMeta(
    "Reusable dropdown menu row patterns for edit actions and check items.",
    "Compose inside `DropdownMenuContent` for map picker menus, tag filters, and inline edit rows.",
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditRow: Story = {
  parameters: storyDocs("Inline edit row with icon buttons."),
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger render={<Button variant="outline">Open</Button>} />
      <DropdownMenuContent>
        <DropdownMenuEditRow>
          <span>My map</span>
          <DropdownMenuEditButton title="Edit" onClick={() => {}}>
            <Pencil />
          </DropdownMenuEditButton>
          <DropdownMenuEditButton title="Delete" onClick={() => {}}>
            <Trash2 />
          </DropdownMenuEditButton>
        </DropdownMenuEditRow>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const CheckItem: Story = {
  parameters: storyDocs("Checkbox-style menu item."),
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger render={<Button variant="outline">Open</Button>} />
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem checked onCheckedChange={() => {}}>
          Show on map
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => {}}>
          Hide from blog
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
