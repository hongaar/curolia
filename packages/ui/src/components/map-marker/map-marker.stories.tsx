import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { MapMarker } from "./map-marker";

const SAMPLE_PHOTO =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=128&h=128&fit=crop";

const meta = {
  title: "Map Marker",
  component: MapMarker,
  ...componentStoryMeta(
    "Circular emoji pin used on the main map and pin detail inset map.",
    "Use `createMapMarkerMount` when attaching markers via MapLibre GL.",
  ),
  args: {
    emoji: "📍",
    fill: "#3b82f6",
    photoUrl: null,
    selected: false,
    hovered: false,
    interactive: true,
    draft: false,
  },
} satisfies Meta<typeof MapMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Tag color fill."),
};

export const Small: Story = {
  parameters: storyDocs(
    '`size="sm"` for compact rows and solid markers without emoji.',
  ),
  args: { size: "sm", emoji: null, interactive: false },
};

export const SolidTagNoEmoji: Story = {
  parameters: storyDocs("Tag color only — no emoji glyph."),
  args: { size: "sm", emoji: null, fill: "#16a34a" },
};

export const Photo: Story = {
  parameters: storyDocs(
    "Photo marker with tag-colored ring (`lg` by default).",
  ),
  args: { photoUrl: SAMPLE_PHOTO, emoji: null },
};

export const PhotoLarge: Story = {
  parameters: storyDocs('Explicit `size="lg"` photo marker.'),
  args: { photoUrl: SAMPLE_PHOTO, size: "lg", emoji: null },
};

export const PhotoNeutral: Story = {
  parameters: storyDocs("Photo marker without a tag color."),
  args: { photoUrl: SAMPLE_PHOTO, fill: null, emoji: null },
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

export const StackedBadge: Story = {
  parameters: storyDocs(
    "Count badge when several pins share the same map point.",
  ),
  args: { badge: 4, interactive: true },
};

export const StackedBadgeLarge: Story = {
  parameters: storyDocs("Caps display at 99+ for very large groups."),
  args: { badge: 120, interactive: true },
};

export const Draft: Story = {
  parameters: storyDocs("Placement preview while creating a pin."),
  args: { draft: true, interactive: false, fill: null, emoji: null },
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
        <MapMarker emoji={null} fill="#16a34a" interactive />
        <MapMarker photoUrl={SAMPLE_PHOTO} fill="#3b82f6" interactive />
        <MapMarker emoji="🍽️" fill="#16a34a" badge={15} interactive />
        <MapMarker emoji={null} fill={null} draft interactive={false} />
      </div>
    </StoryFrame>
  ),
};

export const AutoSizes: Story = {
  parameters: storyDocs(
    "Auto sizes: `sm` solid/neutral, `md` emoji, `lg` photo.",
  ),
  render: () => (
    <StoryFrame width="md">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <MapMarker fill={null} emoji={null} interactive />
        <MapMarker fill="#ef4444" emoji={null} interactive />
        <MapMarker emoji="☕" fill="#92400e" interactive />
        <MapMarker photoUrl={SAMPLE_PHOTO} fill="#3b82f6" interactive />
      </div>
    </StoryFrame>
  ),
};
