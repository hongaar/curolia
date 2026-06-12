import type { Meta, StoryObj } from "@storybook/react";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { PinReactionBar } from "./pin-reactions";

const meta = {
  title: "Pin reactions",
  component: PinReactionBar,
  ...componentStoryMeta(
    "Reaction chips and quick-add controls for pin detail.",
    "Use `PinReactionBar` for a single row of counts, quick picks, and a custom emoji picker.",
  ),
  parameters: storyDocs(
    "Counts, quick-add emojis, and custom picker on one row.",
  ),
  args: {
    reactions: [
      { emoji: "👍", count: 2, active: true },
      { emoji: "❤️", count: 1 },
      { emoji: "🎉", count: 3 },
    ],
    quickAddEmojis: ["👍", "❤️", "😊", "🎉", "🔥", "👏", "✨", "🙌"],
    interactive: true,
    disabled: false,
  },
} satisfies Meta<typeof PinReactionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onToggle: (emoji) => console.log("toggle", emoji),
    onCustomEmoji: (emoji) => console.log("custom", emoji),
  },
};

export const ReadOnly: Story = {
  args: {
    interactive: false,
    reactions: [
      { emoji: "👍", count: 4 },
      { emoji: "🔥", count: 2 },
    ],
  },
};

export const EmptyQuickAdds: Story = {
  args: {
    reactions: [],
    onToggle: (emoji) => console.log("toggle", emoji),
    onCustomEmoji: (emoji) => console.log("custom", emoji),
  },
};
