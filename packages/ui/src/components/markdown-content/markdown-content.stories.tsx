import type { Meta, StoryObj } from "@storybook/react";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { MarkdownContent } from "./markdown-content";

const meta = {
  title: "Markdown Content",
  ...componentStoryMeta(
    "Renders sanitized markdown for pin descriptions and similar copy.",
    "Supports GFM lists, links, bold/italic, and `<u>` underline.",
  ),
  component: MarkdownContent,
} satisfies Meta<typeof MarkdownContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Typical pin description formatting."),
  args: {
    markdown:
      "Weekend in **Paris** with <u>must-see</u> spots.\n\n- Louvre\n- Montmartre\n\nRead more on [the city guide](https://example.com).",
  },
  render: (args) => (
    <StoryFrame width="md">
      <MarkdownContent {...args} />
    </StoryFrame>
  ),
};

export const Empty: Story = {
  parameters: storyDocs("Empty or whitespace `markdown` renders nothing."),
  args: { markdown: "" },
  render: (args) => (
    <StoryFrame width="md">
      <MarkdownContent {...args} />
      <p style={{ margin: "1rem 0 0", fontSize: "0.875rem", opacity: 0.6 }}>
        (No content above — component returned null.)
      </p>
    </StoryFrame>
  ),
};
