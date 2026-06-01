import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { useStoryArgs } from "../../storybook/args";
import { storyWidthSm } from "../../storybook/story-frame";
import { EmojiFieldPicker, PresetColorPicker } from "./picker";

const PRESET_COLORS = [
  ["#e11d48", "#f97316", "#eab308", "#22c55e", "#3b82f6"],
  ["#8b5cf6", "#ec4899", "#64748b", "#0f172a", "#ffffff"],
] as const;

const meta = {
  title: "Picker",
  ...componentStoryMeta(
    `Emoji and preset field pickers for pin forms.`,
    `Use \`EmojiFieldPicker\` and color preset picker in pin edit dialogs.`,
  ),
  component: PresetColorPicker,
  decorators: [storyWidthSm],
} satisfies Meta<typeof PresetColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

type PresetColorArgs = Omit<
  ComponentProps<typeof PresetColorPicker>,
  "onChange"
>;

export const Default: Story = {
  parameters: storyDocs("Preset swatch grid for pin tag colors."),
  args: {
    label: "Tag color",
    value: "#3b82f6",
    colors: PRESET_COLORS,
    onChange: () => undefined,
  },
  render: function Render() {
    const [args, updateArgs] = useStoryArgs<PresetColorArgs>();
    return (
      <PresetColorPicker
        {...args}
        onChange={(value) => updateArgs({ value })}
      />
    );
  },
};

type EmojiFieldArgs = Omit<ComponentProps<typeof EmojiFieldPicker>, "onChange">;

export const EmojiField: StoryObj = {
  parameters: storyDocs("Emoji picker field for pin icons."),
  args: {
    label: "Icon",
    value: "📍",
    onChange: () => undefined,
  },
  render: function Render() {
    const [args, updateArgs] = useStoryArgs<EmojiFieldArgs>();
    return (
      <EmojiFieldPicker {...args} onChange={(value) => updateArgs({ value })} />
    );
  },
};
