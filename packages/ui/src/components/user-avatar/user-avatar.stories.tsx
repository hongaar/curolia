import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryRow } from "../../storybook/story-frame";
import { UserAvatar } from "./user-avatar";

const defaultArgs = {
  storedAvatarUrl: null,
  email: "demo@curolia.app",
  label: "Demo user",
} as const;

const meta = {
  title: "User Avatar",
  ...componentStoryMeta(
    `Avatar with stored URL, Gravatar fallback, and unread dot.`,
    `Pass \`storedAvatarUrl\`, \`email\`, and optional \`gravatarUrl\`. Use in account menu and sharing UI.`,
  ),
  component: UserAvatar,
  args: defaultArgs,
} satisfies Meta<typeof UserAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Avatar with Gravatar fallback when no stored image."),
};

export const StoredAvatar: Story = {
  parameters: storyDocs("`storedAvatarUrl` shown when set."),
  args: {
    ...defaultArgs,
    storedAvatarUrl: "https://picsum.photos/96",
  },
};

export const GravatarFallback: Story = {
  parameters: storyDocs("Gravatar fallback when no stored image is available."),
  args: {
    storedAvatarUrl: null,
    email: "demo@curolia.app",
    label: "Demo user",
  },
};

export const Sizes: Story = {
  parameters: storyDocs(
    "`size` tokens: `sm` (1.5rem), `md` (2rem), `lg` (6rem), and `full` (fills parent).",
  ),
  render: (args) => (
    <StoryRow>
      <UserAvatar {...args} size="sm" />
      <UserAvatar {...args} size="md" />
      <UserAvatar {...args} size="lg" />
      <div style={{ width: "2.5rem", height: "2.5rem" }}>
        <UserAvatar {...args} size="full" />
      </div>
    </StoryRow>
  ),
};

export const UnreadDot: Story = {
  parameters: storyDocs("Notification indicator on avatar."),
  args: {
    ...defaultArgs,
    showUnreadDot: true,
  },
};
