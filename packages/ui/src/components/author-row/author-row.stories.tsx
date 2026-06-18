import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { UserAvatar } from "../user-avatar";
import { AuthorRow } from "./author-row";

const meta = {
  title: "Author Row",
  ...componentStoryMeta(
    "Compact avatar and display name row used on map cards and comment bylines.",
    "Pass a small `UserAvatar` and the author name.",
  ),
  component: AuthorRow,
  args: {
    name: "Tester",
    avatar: (
      <UserAvatar
        storedAvatarUrl={null}
        email={null}
        gravatarUrl="https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?d=404"
        size="xs"
        label="Tester"
      />
    ),
  },
} satisfies Meta<typeof AuthorRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <StoryFrame width="sm">
      <AuthorRow {...args} />
    </StoryFrame>
  ),
  ...storyDocs("Avatar beside a muted display name."),
};

export const NameOnly: Story = {
  args: {
    avatar: undefined,
    name: "Guest commenter",
  },
  render: (args) => (
    <StoryFrame width="sm">
      <AuthorRow {...args} />
    </StoryFrame>
  ),
  ...storyDocs("Display name without an avatar."),
};

export const Linked: Story = {
  args: {
    name: "Joram van den Boezem",
    nameHref: "/joram",
  },
  render: (args) => (
    <StoryFrame width="sm">
      <AuthorRow {...args} />
    </StoryFrame>
  ),
  ...storyDocs("Display name links to the author's public profile."),
};
