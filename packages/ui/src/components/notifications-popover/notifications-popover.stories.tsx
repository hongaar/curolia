import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { Popover } from "../popover";
import {
  NotificationsIconPopoverTrigger,
  NotificationsPopoverContent,
  NotificationsPopoverHeader,
  NotificationsPopoverItem,
  NotificationsPopoverList,
  NotificationsPopoverScroll,
  NotificationsSeeAllButton,
} from "./notifications-popover";

const meta = {
  title: "Notifications Popover",
  ...componentStoryMeta(
    `Popover list styling for in-app notifications.`,
    `Pair with toolbar trigger; reuse sidebar row patterns for each notification.`,
  ),
  component: NotificationsPopoverContent,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Notifications popover list chrome."),
  render: () => (
    <Popover defaultOpen>
      <NotificationsIconPopoverTrigger hasUnread aria-label="Notifications" />
      <NotificationsPopoverContent align="end">
        <NotificationsPopoverHeader
          title="Notifications"
          action={
            <NotificationsSeeAllButton onClick={() => undefined}>
              See all
            </NotificationsSeeAllButton>
          }
        />
        <NotificationsPopoverScroll>
          <NotificationsPopoverList>
            <NotificationsPopoverItem
              unread
              title="Map invitation"
              body='Alex invited you to "Summer 2025".'
              onClick={() => undefined}
            />
            <NotificationsPopoverItem
              unread={false}
              title="Pin comment"
              body="Sam mentioned you on Café de Flore."
              onClick={() => undefined}
            />
          </NotificationsPopoverList>
        </NotificationsPopoverScroll>
      </NotificationsPopoverContent>
    </Popover>
  ),
};

export const ToolbarTrigger: Story = {
  parameters: storyDocs("Bell trigger with unread dot for the main toolbar."),
  render: () => (
    <Popover>
      <NotificationsIconPopoverTrigger hasUnread aria-label="Notifications" />
      <NotificationsPopoverContent align="end">
        <NotificationsPopoverHeader
          title="Notifications"
          action={
            <Button variant="ghost" size="sm">
              See all
            </Button>
          }
        />
      </NotificationsPopoverContent>
    </Popover>
  ),
};
