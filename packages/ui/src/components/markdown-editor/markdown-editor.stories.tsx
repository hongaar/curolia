import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { MarkdownEditor } from "./markdown-editor";

const meta = {
  title: "Markdown Editor",
  ...componentStoryMeta(
    "Rich-text markdown field (MDXEditor) with Curolia toolbar styling for pin descriptions.",
    "Stores markdown; pair with `MarkdownContent` for display. Lazy-loaded in the app shell.",
  ),
  component: MarkdownEditor,
  args: {
    value: "",
    onChange: () => {},
  },
} satisfies Meta<typeof MarkdownEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Bold, italic, underline, lists, and links."),
  args: {
    value:
      "A **memorable** visit with *great* food.\n\n- First stop\n- Second stop\n\n1. Morning\n2. Evening",
    placeholder: "Notes about this place…",
    rows: 4,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <StoryFrame width="md">
        <MarkdownEditor {...args} value={value} onChange={setValue} />
      </StoryFrame>
    );
  },
};

export const Empty: Story = {
  parameters: storyDocs("Empty value with placeholder copy."),
  args: {
    value: "",
    placeholder: "Notes about this place…",
    rows: 4,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <StoryFrame width="md">
        <MarkdownEditor {...args} value={value} onChange={setValue} />
      </StoryFrame>
    );
  },
};

export const Disabled: Story = {
  parameters: storyDocs("`disabled` read-only editor."),
  args: {
    value: "Saved description text.",
    placeholder: "Notes about this place…",
    rows: 4,
    disabled: true,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <StoryFrame width="md">
        <MarkdownEditor {...args} value={value} onChange={setValue} />
      </StoryFrame>
    );
  },
};
