import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { MapMarker } from "./map-marker";

const meta = {
  title: "Map Marker",
  component: MapMarker,
  ...componentStoryMeta(
    "Emoji pin used on the main map and pin detail inset map.",
    "Use `createMapMarkerMount` when attaching markers via MapLibre GL.",
  ),
  args: {
    emoji: "📍",
    fill: "#3b82f6",
    selected: false,
    hovered: false,
    interactive: true,
    draft: false,
  },
} satisfies Meta<typeof MapMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Default ring with tag color fill."),
};

export const Selected: Story = {
  parameters: storyDocs("Selected pin on the main map."),
  args: { selected: true },
};

export const Hovered: Story = {
  parameters: storyDocs("Hovered pin preview state."),
  args: { hovered: true },
};

export const Dimmed: Story = {
  parameters: storyDocs("De-emphasized when another pin is selected."),
  args: { dimmed: true },
};

export const Draft: Story = {
  parameters: storyDocs("Placement preview while creating a pin."),
  args: { draft: true, interactive: false, fill: null },
};

export const InsetSelected: Story = {
  parameters: storyDocs("Non-interactive marker on the pin detail inset map."),
  args: { selected: true, interactive: false },
};

export const States: Story = {
  parameters: storyDocs("Common marker states side by side."),
  render: () => (
    <StoryFrame width="md">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <MapMarker emoji="🏔️" fill="#22c55e" interactive />
        <MapMarker emoji="🏔️" fill="#22c55e" selected interactive />
        <MapMarker emoji="🏔️" fill="#22c55e" hovered interactive />
        <MapMarker emoji="🏔️" fill="#22c55e" dimmed interactive />
        <MapMarker emoji="📍" fill={null} draft interactive={false} />
      </div>
    </StoryFrame>
  ),
};
