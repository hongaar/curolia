import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { TraceMetadataFooter } from "./trace-metadata-footer";

const meta = {
  title: "Trace Metadata Footer",
  ...componentStoryMeta(
    `Footer strip for trace dates, source, and compact metadata.`,
    `Place below trace content in sidebar or detail views.`,
  ),
  component: TraceMetadataFooter,
  args: {
    createdLine: "Created 12 Jun 2025",
    modifiedLine: "Updated 14 Jun 2025",
  },
  decorators: [
    (Story) => (
      <StoryFrame width="sm">
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta<typeof TraceMetadataFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Created and modified timestamps below trace content."),
};

export const CreatedOnly: Story = {
  parameters: storyDocs(
    "`modifiedLine` omitted — only the created line is shown.",
  ),
  args: {
    createdLine: "Created 12 Jun 2025",
    modifiedLine: undefined,
  },
};

export const WithModified: Story = {
  parameters: storyDocs("Both `createdLine` and `modifiedLine` visible."),
  args: {
    createdLine: "Created 12 Jun 2025",
    modifiedLine: "Updated 14 Jun 2025",
  },
};
