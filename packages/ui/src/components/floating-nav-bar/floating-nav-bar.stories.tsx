import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { DropdownMenu } from "../dropdown-menu";
import { UserAvatar } from "../user-avatar";
import {
  AccountMenuContent,
  AccountMenuSignedInLabel,
  AccountMenuTrigger,
} from "./floating-nav-bar";

const meta = {
  title: "Account Menu",
  ...componentStoryMeta(
    "Account dropdown primitives used in the main toolbar.",
    "Wrap content in `DropdownMenu` with `AccountMenuTrigger` and `AccountMenuContent`.",
  ),
  component: AccountMenuTrigger,
} satisfies Meta<typeof AccountMenuTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Avatar trigger with sample menu items."),
  render: () => (
    <DropdownMenu>
      <AccountMenuTrigger title="Account" aria-label="Account menu">
        <UserAvatar
          email="demo@curolia.app"
          storedAvatarUrl={null}
          label="Demo"
          size="full"
        />
      </AccountMenuTrigger>
      <AccountMenuContent>
        <AccountMenuSignedInLabel email="demo@curolia.app" />
        <Button variant="ghost" size="sm">
          Profile
        </Button>
        <Button variant="ghost" size="sm">
          Sign out
        </Button>
      </AccountMenuContent>
    </DropdownMenu>
  ),
};

export const UnreadDotOnTrigger: Story = {
  parameters: storyDocs(
    "Unread dot on the avatar must not clip at the trigger edge.",
  ),
  render: () => (
    <DropdownMenu defaultOpen>
      <AccountMenuTrigger title="Account" aria-label="Account menu">
        <UserAvatar
          email="demo@curolia.app"
          storedAvatarUrl={null}
          label="Demo"
          size="full"
          showUnreadDot
        />
      </AccountMenuTrigger>
      <AccountMenuContent>
        <AccountMenuSignedInLabel email="demo@curolia.app" />
      </AccountMenuContent>
    </DropdownMenu>
  ),
};
