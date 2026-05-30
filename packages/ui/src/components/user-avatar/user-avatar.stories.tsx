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
  title: "Components/User Avatar",
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

export const Placeholder: Story = {
  parameters: storyDocs("Avatar fallback when no stored image is available."),
};

export const Sizes: Story = {
  parameters: storyDocs("Size tokens: sm, md, and lg."),
  render: function Render(args) {
    return (
      <StoryRow>
        <UserAvatar {...args} size="sm" />
        <UserAvatar {...args} size="md" />
        <UserAvatar {...args} size="lg" />
      </StoryRow>
    );
  },
};

export const UnreadDot: Story = {
  parameters: storyDocs("Notification indicator on avatar."),
  args: {
    ...defaultArgs,
    showUnreadDot: true,
  },
};
