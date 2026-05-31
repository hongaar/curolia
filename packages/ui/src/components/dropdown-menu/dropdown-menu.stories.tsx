import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

/** Demo-only args for checkbox/radio stories (not on `DropdownMenu` root). */
type DropdownMenuDemoArgs = {
  showBookmarks?: boolean;
  sort?: string;
};

const meta = {
  title: "Dropdown Menu",
  ...componentStoryMeta(
    `Anchored menu for actions and navigation shortcuts.`,
    `Wrap the trigger with \`DropdownMenuTrigger\` and place items in \`DropdownMenuContent\`. Wrap \`DropdownMenuLabel\` in \`DropdownMenuGroup\`. Use \`align\` and \`side\` on content for positioning.`,
  ),
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

function MenuTrigger({ label = "Open menu" }: { label?: string }) {
  return (
    <DropdownMenuTrigger render={<Button variant="outline" />}>
      {label}
    </DropdownMenuTrigger>
  );
}

export const Default: Story = {
  parameters: storyDocs(
    "Menu with grouped label, items, shortcut, and separator.",
  ),
  render: () => (
    <DropdownMenu>
      <MenuTrigger />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const DestructiveItem: Story = {
  parameters: storyDocs('`variant="destructive"` for irreversible actions.'),
  render: () => (
    <DropdownMenu>
      <MenuTrigger label="Actions" />
      <DropdownMenuContent>
        <DropdownMenuItem variant="destructive">
          Delete journal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const CheckboxItems: Story = {
  parameters: storyDocs("Checkbox items for multi-select filters."),
  args: { showBookmarks: true } as Story["args"],
  render: function Render() {
    const [{ showBookmarks = true }, updateArgs] =
      useStoryArgs<DropdownMenuDemoArgs>();
    return (
      <DropdownMenu>
        <MenuTrigger label="View" />
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Columns</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={showBookmarks}
              onCheckedChange={(value) =>
                updateArgs({ showBookmarks: value === true })
              }
            >
              Show bookmarks
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

export const RadioItems: Story = {
  parameters: storyDocs("Radio group for single-choice options."),
  args: { sort: "newest" } as Story["args"],
  render: function Render() {
    const [{ sort = "newest" }, updateArgs] =
      useStoryArgs<DropdownMenuDemoArgs>();
    return (
      <DropdownMenu>
        <MenuTrigger label="Sort" />
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => updateArgs({ sort: value })}
            >
              <DropdownMenuRadioItem value="newest">
                Newest first
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest">
                Oldest first
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

export const Submenu: Story = {
  parameters: storyDocs("Nested submenu for grouped actions."),
  render: () => (
    <DropdownMenu>
      <MenuTrigger />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Share</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Email</DropdownMenuItem>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const AlignEnd: Story = {
  parameters: storyDocs('`align="end"` on content for right-aligned triggers.'),
  render: () => (
    <DropdownMenu>
      <MenuTrigger />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Aligned end</DropdownMenuLabel>
          <DropdownMenuItem>Item one</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
