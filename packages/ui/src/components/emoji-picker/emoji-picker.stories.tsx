import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryColumn } from "../../storybook/story-frame";
import {
  EmojiPicker,
  EmojiPickerClear,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "./emoji-picker";

/** Demo-only arg; not a prop on `EmojiPicker` (see Storybook custom args). */
type EmojiPickerDemoArgs = {
  selectedEmoji: string;
};

const meta = {
  title: "Emoji Picker",
  ...componentStoryMeta(
    `Frimousse-based emoji selector with search and footer.`,
    `Compose \`EmojiPicker\` with \`EmojiPickerSearch\`, \`EmojiPickerContent\`, and \`EmojiPickerFooter\`. Place \`EmojiPickerClear\` between content and footer when the field may have no icon.`,
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

export const Clearable: Story = {
  parameters: storyDocs(
    "Optional `EmojiPickerClear` row to remove the current selection.",
  ),
  args: {
    selectedEmoji: "🏔️",
  } as Story["args"],
  render: function Render() {
    const [{ selectedEmoji }, updateArgs] = useStoryArgs<EmojiPickerDemoArgs>();
    return (
      <StoryColumn>
        <p style={{ margin: 0 }}>
          Selected: {selectedEmoji.trim() ? selectedEmoji : "(none)"}
        </p>
        <EmojiPicker
          onEmojiSelect={(selection) =>
            updateArgs({ selectedEmoji: selection.emoji })
          }
        >
          <EmojiPickerSearch placeholder="Search emoji…" />
          <EmojiPickerContent />
          <EmojiPickerClear onClear={() => updateArgs({ selectedEmoji: "" })} />
          <EmojiPickerFooter />
        </EmojiPicker>
      </StoryColumn>
    );
  },
};
