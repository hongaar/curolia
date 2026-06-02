import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { MarkdownEditor } from "./markdown-editor";

const meta = {
  title: "Markdown Editor",
  ...componentStoryMeta(
    "Simple markdown field with formatting toolbar for pin descriptions.",
    "Stores markdown text; pair with `MarkdownContent` for display.",
  ),
  component: MarkdownEditor,
} satisfies Meta<typeof MarkdownEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Bold, italic, underline, lists, and links."),
  render: function Render() {
    const [value, setValue] = useState(
      "A **memorable** visit with *great* food.\n\n- First stop\n- Second stop\n\n1. Morning\n2. Evening",
    );
    return (
      <StoryFrame width="md">
        <MarkdownEditor value={value} onChange={setValue} />
      </StoryFrame>
    );
  },
};
