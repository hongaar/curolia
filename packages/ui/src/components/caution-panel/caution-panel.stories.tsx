import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { CautionPanel } from "./caution-panel";

const meta = {
  title: "Components/Caution Panel",
  ...componentStoryMeta(
    `Highlighted warning block for destructive or irreversible actions.`,
    `Pass \`title\` and optional \`description\`; place the primary action in \`children\` (e.g. a destructive Button).`,
  ),
  component: CautionPanel,
  decorators: [
    (Story) => (
      <StoryFrame width="md">
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta<typeof CautionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs(
    "Warning panel with title, description, and destructive action.",
  ),
  args: {
    title: "Delete journal",
    description: "All traces in this journal will be permanently removed.",
    children: <Button variant="destructive">Delete journal</Button>,
  },
};

export const TitleOnly: Story = {
  parameters: storyDocs("`description` omitted — heading and action only."),
  args: {
    title: "Remove plugin",
    description: undefined,
    children: <Button variant="destructive">Remove</Button>,
  },
};

export const WithDescription: Story = {
  parameters: storyDocs("Supporting copy via `description`."),
  args: {
    title: "Delete journal",
    description: "All traces in this journal will be permanently removed.",
    children: <Button variant="destructive">Delete journal</Button>,
  },
};
