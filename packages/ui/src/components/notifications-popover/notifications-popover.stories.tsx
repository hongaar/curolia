import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { Popover, PopoverTrigger } from "../popover";
import {
  NotificationsPopoverContent,
  NotificationsPopoverHeader,
  NotificationsPopoverItem,
  NotificationsPopoverScroll,
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
      <PopoverTrigger render={<Button variant="outline" />}>
        Notifications
      </PopoverTrigger>
      <NotificationsPopoverContent align="end">
        <NotificationsPopoverHeader
          title="Notifications"
          action={
            <Button variant="ghost" size="sm">
              Mark all read
            </Button>
          }
        />
        <NotificationsPopoverScroll>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            <NotificationsPopoverItem
              unread
              title="Journal invitation"
              body='Alex invited you to "Summer 2025".'
              onClick={() => undefined}
            />
            <NotificationsPopoverItem
              unread={false}
              title="Trace comment"
              body="Sam mentioned you on Café de Flore."
              onClick={() => undefined}
            />
          </ul>
        </NotificationsPopoverScroll>
      </NotificationsPopoverContent>
    </Popover>
  ),
};
