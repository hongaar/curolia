import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { useStoryArgs } from "../../storybook/args";
import { StoryColumn } from "../../storybook/story-frame";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "./emoji-picker";

/** Demo-only arg; not a prop on `EmojiPicker` (see Storybook custom args). */
type EmojiPickerDemoArgs = {
  selectedEmoji: string;
};

const meta = {
  title: "Components/Emoji Picker",
  ...componentStoryMeta(
    `Frimousse-based emoji selector with search and footer.`,
    `Compose \`EmojiPicker\` with \`EmojiPickerSearch\`, \`EmojiPickerContent\`, and \`EmojiPickerFooter\`. Handle selection in \`onEmojiSelect\`.`,
  ),
  component: EmojiPicker,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Emoji picker with search and footer."),
  args: {
    selectedEmoji: "📍",
  } as Story["args"],
  render: function Render() {
    const [{ selectedEmoji }, updateArgs] = useStoryArgs<EmojiPickerDemoArgs>();
    return (
      <StoryColumn>
        <p style={{ margin: 0 }}>Selected: {selectedEmoji}</p>
        <EmojiPicker
          onEmojiSelect={(selection) =>
            updateArgs({ selectedEmoji: selection.emoji })
          }
        >
          <EmojiPickerSearch placeholder="Search emoji…" />
          <EmojiPickerContent />
          <EmojiPickerFooter />
        </EmojiPicker>
      </StoryColumn>
    );
  },
};
