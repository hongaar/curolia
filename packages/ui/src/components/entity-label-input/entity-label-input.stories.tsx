import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyWidthSm } from "../../storybook/story-frame";
import { randomFromColorGrid } from "../color-picker";
import { EntityLabelInput } from "./entity-label-input";

const PRESET_COLORS = [
  [
    "#fecdd3",
    "#fed7aa",
    "#fef08a",
    "#bbf7d0",
    "#bfdbfe",
    "#ddd6fe",
    "#fbcfe8",
    "#e2e8f0",
  ],
  [
    "#fb7185",
    "#fb923c",
    "#facc15",
    "#4ade80",
    "#60a5fa",
    "#a78bfa",
    "#f472b6",
    "#94a3b8",
  ],
  [
    "#e11d48",
    "#ea580c",
    "#ca8a04",
    "#16a34a",
    "#2563eb",
    "#7c3aed",
    "#db2777",
    "#64748b",
  ],
  [
    "#9f1239",
    "#9a3412",
    "#854d0e",
    "#166534",
    "#1e40af",
    "#5b21b6",
    "#9d174d",
    "#334155",
  ],
  [
    "#881337",
    "#7c2d12",
    "#713f12",
    "#14532d",
    "#1e3a8a",
    "#4c1d95",
    "#831843",
    "#0f172a",
  ],
] as const;

const meta = {
  title: "Entity label input",
  ...componentStoryMeta(
    "Single control for a label name with optional color and emoji adornments.",
    "Use for map and tag create/edit dialogs. Pass `colors` and `onColorChange` to show the color swatch; pass `onEmojiChange` for the emoji picker. Call `randomFromColorGrid(colors)` from `@curolia/ui/color-picker` when opening a create dialog.",
  ),
  component: EntityLabelInput,
  decorators: [storyWidthSm],
} satisfies Meta<typeof EntityLabelInput>;

export default meta;
type Story = StoryObj<typeof meta>;

type EntityLabelArgs = Omit<
  ComponentProps<typeof EntityLabelInput>,
  "onNameChange" | "onColorChange" | "onEmojiChange"
>;

export const Tag: Story = {
  parameters: storyDocs("Tag with name, preset color, and emoji."),
  args: {
    label: "Tag",
    name: "Weekend trips",
    color: "#2563eb",
    colors: PRESET_COLORS,
    emoji: "🏕️",
    placeholder: "Tag name",
    onNameChange: () => undefined,
    onColorChange: () => undefined,
    onEmojiChange: () => undefined,
  },
  render: function Render() {
    const [args, updateArgs] = useStoryArgs<EntityLabelArgs>();
    return (
      <EntityLabelInput
        {...args}
        onNameChange={(name) => updateArgs({ name })}
        onColorChange={(color) => updateArgs({ color })}
        onEmojiChange={(emoji) => updateArgs({ emoji })}
      />
    );
  },
};

export const Map: Story = {
  parameters: storyDocs("Map name with emoji only (no color)."),
  args: {
    label: "Map",
    name: "Family trips",
    emoji: "📔",
    emojiFallback: "📔",
    placeholder: "Map name",
    onNameChange: () => undefined,
    onEmojiChange: () => undefined,
  },
  render: function Render() {
    const [args, updateArgs] =
      useStoryArgs<
        Omit<EntityLabelArgs, "color" | "colors" | "onColorChange">
      >();
    return (
      <EntityLabelInput
        {...args}
        onNameChange={(name) => updateArgs({ name })}
        onEmojiChange={(emoji) => updateArgs({ emoji })}
      />
    );
  },
};

export const NameOnly: Story = {
  parameters: storyDocs("Name field without color or emoji adornments."),
  args: {
    label: "Name",
    name: "",
    placeholder: "Enter a name…",
    onNameChange: () => undefined,
  },
  render: function Render() {
    const [args, updateArgs] =
      useStoryArgs<
        Pick<EntityLabelArgs, "label" | "name" | "placeholder" | "disabled">
      >();
    return (
      <EntityLabelInput
        {...args}
        onNameChange={(name) => updateArgs({ name })}
      />
    );
  },
};

export const ClearableTag: Story = {
  parameters: storyDocs(
    "Tags may omit an icon — empty state shows a dotted circle; picker has a No icon row.",
  ),
  args: {
    label: "Tag",
    name: "Food",
    color: "#16a34a",
    colors: PRESET_COLORS,
    emoji: "",
    emojiClearable: true,
    placeholder: "Tag name",
    onNameChange: () => undefined,
    onColorChange: () => undefined,
    onEmojiChange: () => undefined,
  },
  render: Tag.render,
};

export const RandomColor: Story = {
  parameters: storyDocs(
    "Create flow: start with a random preset color via `randomFromColorGrid`.",
  ),
  args: {
    label: "New tag",
    name: "",
    color: randomFromColorGrid(PRESET_COLORS),
    colors: PRESET_COLORS,
    emoji: "",
    emojiClearable: true,
    placeholder: "Tag name",
    onNameChange: () => undefined,
    onColorChange: () => undefined,
    onEmojiChange: () => undefined,
  },
  render: Tag.render,
};

export const Disabled: Story = {
  parameters: storyDocs("Disabled state for settings surfaces."),
  args: {
    label: "Map",
    name: "Read-only map",
    emoji: "🗺️",
    disabled: true,
    onNameChange: () => undefined,
    onEmojiChange: () => undefined,
  },
  render: Map.render,
};
