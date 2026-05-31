import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { TraceMapMarker } from "./trace-map-marker";

const meta = {
  title: "Components/Map Marker",
  component: TraceMapMarker,
  ...componentStoryMeta(
    "Emoji pin used on the main trace map and trace detail inset map.",
    "Use `createTraceMapMarkerMount` when attaching markers via MapLibre GL.",
  ),
  args: {
    emoji: "📍",
    fill: "#3b82f6",
    selected: false,
    hovered: false,
    interactive: true,
    draft: false,
  },
} satisfies Meta<typeof TraceMapMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Default ring with tag color fill."),
};

export const Selected: Story = {
  parameters: storyDocs("Selected trace on the main map."),
  args: { selected: true },
};

export const Hovered: Story = {
  parameters: storyDocs("Hovered trace preview state."),
  args: { hovered: true },
};

export const Draft: Story = {
  parameters: storyDocs("Placement preview while creating a trace."),
  args: { draft: true, interactive: false, fill: null },
};

export const InsetSelected: Story = {
  parameters: storyDocs(
    "Non-interactive marker on the trace detail inset map.",
  ),
  args: { selected: true, interactive: false },
};

export const States: Story = {
  parameters: storyDocs("Common marker states side by side."),
  render: () => (
    <StoryFrame width="md">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <TraceMapMarker emoji="🏔️" fill="#22c55e" interactive />
        <TraceMapMarker emoji="🏔️" fill="#22c55e" selected interactive />
        <TraceMapMarker emoji="🏔️" fill="#22c55e" hovered interactive />
        <TraceMapMarker emoji="📍" fill={null} draft interactive={false} />
      </div>
    </StoryFrame>
  ),
};
