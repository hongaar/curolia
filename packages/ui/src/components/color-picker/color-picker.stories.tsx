import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryColumn } from "../../storybook/story-frame";
import {
  ColorPicker,
  ColorPickerFooter,
  ColorPickerGrid,
  ColorPickerRandom,
  ColorPickerTitle,
  randomFromColorGrid,
} from "./color-picker";

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

/** Demo-only arg; not a prop on `ColorPicker` (see Storybook custom args). */
type ColorPickerDemoArgs = {
  selectedColor: string;
};

const meta = {
  title: "Color Picker",
  ...componentStoryMeta(
    "Composable preset color selector with grid, random pick, and footer.",
    "Compose `ColorPicker` with `ColorPickerTitle`, `ColorPickerGrid`, optional `ColorPickerRandom`, and `ColorPickerFooter`. Handle selection in `onColorSelect`. Pass any preset grid via `colors`.",
  ),
  args: {
    selectedColor: "#2563eb",
  },
} satisfies Meta<ColorPickerDemoArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Preset swatch grid with random pick and footer."),
  render: function Render() {
    const [{ selectedColor }, updateArgs] = useStoryArgs<ColorPickerDemoArgs>();
    return (
      <StoryColumn>
        <ColorPicker
          value={selectedColor}
          colors={PRESET_COLORS}
          onColorSelect={(hex) => updateArgs({ selectedColor: hex })}
        >
          <ColorPickerTitle />
          <ColorPickerGrid />
          <ColorPickerRandom />
          <ColorPickerFooter />
        </ColorPicker>
      </StoryColumn>
    );
  },
};

export const GridOnly: Story = {
  parameters: storyDocs("Minimal grid without random action or footer."),
  args: {
    selectedColor: randomFromColorGrid(PRESET_COLORS),
  },
  render: function Render() {
    const [{ selectedColor }, updateArgs] = useStoryArgs<ColorPickerDemoArgs>();
    return (
      <ColorPicker
        value={selectedColor}
        colors={PRESET_COLORS}
        onColorSelect={(hex) => updateArgs({ selectedColor: hex })}
      >
        <ColorPickerTitle>Preset colors</ColorPickerTitle>
        <ColorPickerGrid />
      </ColorPicker>
    );
  },
};
