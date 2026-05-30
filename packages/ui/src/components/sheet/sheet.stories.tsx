import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyFrameStyles } from "../../storybook/story-frame";
import { Button } from "../button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "Components/Sheet",
  ...componentStoryMeta(
    `Edge-attached drawer for mobile-friendly panels.`,
    `Set \`side\` on \`SheetContent\` (\`right\`, \`left\`, \`top\`, \`bottom\`). Use \`showCloseButton\` when dismissal should be explicit.`,
  ),
  component: Sheet,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Right-edge sheet opened from a trigger."),
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        Open sheet
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Panel</SheetTitle>
          <SheetDescription>Sheet content goes here.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

export const Bottom: Story = {
  parameters: storyDocs("Bottom story."),
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        Open bottom sheet
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Mobile actions</SheetTitle>
          <SheetDescription>Designed for short action lists.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
