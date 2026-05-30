import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { TraceMetadataFooter } from "./trace-metadata-footer";

const meta = {
  title: "Components/Trace Metadata Footer",
  ...componentStoryMeta(
    `Footer strip for trace dates, source, and compact metadata.`,
    `Place below trace content in sidebar or detail views.`,
  ),
  component: TraceMetadataFooter,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Created and modified timestamps below trace content."),
  render: () => (
    <StoryFrame width="sm">
      <TraceMetadataFooter
        createdLine="Created 12 Jun 2025"
        modifiedLine="Updated 14 Jun 2025"
      />
    </StoryFrame>
  ),
};
