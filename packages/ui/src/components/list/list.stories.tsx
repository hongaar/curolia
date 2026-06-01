import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyWidthMd } from "../../storybook/story-frame";
import { BorderedList, NotificationListButton } from "./list";

const meta = {
  title: "List",
  ...componentStoryMeta(
    `Rows and headers for notifications, invitations, and sharing lists.`,
    `Compose \`PluginListRow\`-style patterns or list-specific exports for each page.`,
  ),
  component: BorderedList,
  decorators: [storyWidthMd],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Bordered list with notification row buttons."),
  render: () => (
    <BorderedList>
      <NotificationListButton
        unread
        title="Map invitation"
        body='Alex invited you to "Summer 2025".'
        meta="2h ago"
        onClick={() => undefined}
      />
      <NotificationListButton
        unread={false}
        title="Pin comment"
        body="Sam mentioned you on Café de Flore."
        meta="Yesterday"
        onClick={() => undefined}
      />
    </BorderedList>
  ),
};
