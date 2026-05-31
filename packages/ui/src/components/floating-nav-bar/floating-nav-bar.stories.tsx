import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { DropdownMenu } from "../dropdown-menu";
import { UserAvatar } from "../user-avatar";
import {
  AccountMenuContent,
  AccountMenuTrigger,
  FloatingNavBar,
} from "./floating-nav-bar";
import { MainToolbarBrand, MainToolbarShell } from "../main-toolbar-panel";

const meta = {
  title: "Floating Nav Bar",
  ...componentStoryMeta(
    `Top header row hosting toolbar and account menu slots.`,
    `Pass \`toolbar\` (usually \`MainToolbarShell\`) and wrap \`accountMenu\` in \`DropdownMenu\` with \`AccountMenuTrigger\` / \`AccountMenuContent\`.`,
  ),
  component: FloatingNavBar,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Top bar with toolbar slot and account menu."),
  render: () => (
    <FloatingNavBar
      toolbar={
        <MainToolbarShell>
          <MainToolbarBrand>Curolia</MainToolbarBrand>
        </MainToolbarShell>
      }
      accountMenu={
        <DropdownMenu>
          <AccountMenuTrigger title="Account" aria-label="Account menu">
            <UserAvatar
              email="demo@curolia.app"
              storedAvatarUrl={null}
              label="Demo"
              size="sm"
            />
          </AccountMenuTrigger>
          <AccountMenuContent>
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </AccountMenuContent>
        </DropdownMenu>
      }
    />
  ),
};
