import type { Meta, StoryObj } from "@storybook/react";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { MapCard, MapCardEmptyState, MapCardMasonryGrid } from "./map-card";

const meta = {
  title: "Map card",
  component: MapCard,
  ...componentStoryMeta(
    "Immersive masonry map cards for public profile pages.",
    "Cover photos keep their natural aspect ratio. Emoji-only cards use a deterministic ratio from `layoutSeed`.",
  ),
  args: {
    to: "/alex/europe",
    title: "Europe 2025",
    description: "A summer road trip through the Alps and along the Adriatic.",
    coverUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80&auto=format&fit=crop",
    iconEmoji: "🗺️",
    layoutSeed: "europe-2025",
    pinCountLabel: "42 pins",
    updatedLabel: "Updated 3d ago",
  },
} satisfies Meta<typeof MapCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutCover: Story = {
  args: {
    coverUrl: null,
    title: "Weekend hikes",
    description: "Local trails and lookout points around home.",
    layoutSeed: "weekend-hikes",
    pinCountLabel: "8 pins",
    updatedLabel: "Updated 1w ago",
  },
  ...storyDocs(
    "Blurred, saturated emoji backdrop with a sharp centered mark in a glass circle.",
  ),
};

export const TitleOnly: Story = {
  args: {
    coverUrl: null,
    description: undefined,
    title: "Food map",
    iconEmoji: "🍜",
    layoutSeed: "food-map",
    pinCountLabel: "1 pin",
    updatedLabel: "Updated just now",
  },
  ...storyDocs("Minimal card with title and stats only."),
};

export const MasonryGrid: Story = {
  render: () => (
    <MapCardMasonryGrid>
      <MapCard
        to="/alex/europe"
        title="Europe 2025"
        description="A summer road trip through the Alps and along the Adriatic coast."
        coverUrl="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80&auto=format&fit=crop"
        iconEmoji="🗺️"
        layoutSeed="map-europe"
        pinCountLabel="42 pins"
        updatedLabel="Updated 3d ago"
      />
      <MapCard
        to="/alex/weekend-hikes"
        title="Weekend hikes"
        description="Local trails and lookout points."
        iconEmoji="🥾"
        layoutSeed="map-hikes"
        pinCountLabel="8 pins"
        updatedLabel="Updated 1w ago"
      />
      <MapCard
        to="/alex/food"
        title="Food map"
        coverUrl="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=1200&q=80&auto=format&fit=crop"
        iconEmoji="🍜"
        layoutSeed="map-food"
        pinCountLabel="26 pins"
        updatedLabel="Updated 2h ago"
      />
      <MapCard
        to="/alex/family"
        title="Family visits"
        iconEmoji="👨‍👩‍👧‍👦"
        layoutSeed="map-family"
        pinCountLabel="No pins"
        updatedLabel="Updated 4mo ago"
      />
    </MapCardMasonryGrid>
  ),
  ...storyDocs("Mixed cover ratios and deterministic emoji-card heights."),
};

export const Empty: Story = {
  render: () => <MapCardEmptyState>No maps to show yet.</MapCardEmptyState>,
  ...storyDocs("Placeholder when a profile has no visible maps."),
};
