import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import {
  StoryColumn,
  StoryFrame,
  storyFrameStyles,
} from "../../storybook/story-frame";
import { Separator } from "./separator";

const meta = {
  title: "Separator",
  ...componentStoryMeta(
    `Visual divider between sections.`,
    `Set \`orientation\` to \`horizontal\` or \`vertical\`. Decorative only—no semantics.`,
  ),
  component: Separator,
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Horizontal divider between sections."),
};

export const Vertical: Story = {
  parameters: storyDocs("Vertical story."),
  args: { orientation: "vertical" },
  render: function Render(args) {
    return (
      <div className={storyFrameStyles.verticalRow}>
        <span>Left</span>
        <Separator {...args} />
        <span>Right</span>
      </div>
    );
  },
};
