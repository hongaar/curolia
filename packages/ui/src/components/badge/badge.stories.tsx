import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryRow } from "../../storybook/story-frame";
import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  ...componentStoryMeta(
    `Small status or category label for traces, plugins, and filters.`,
    `Use \`variant\` for semantic color. Prefer short text; pair with icons only when the meaning is not clear from the label alone.`,
  ),
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Default badge for status or category labels."),
  args: { children: "New" },
};

export const Variants: Story = {
  parameters: storyDocs("Variants story."),
  render: () => (
    <StoryRow>
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </StoryRow>
  ),
};
