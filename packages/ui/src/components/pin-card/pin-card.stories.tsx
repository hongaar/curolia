import type { Meta, StoryObj } from "@storybook/react";

import { withMemoryRouter } from "../../storybook/decorators";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { TagBadge } from "../tag-badge";
import { MapCardMasonryGrid } from "../map-card/map-card";
import { PinCard, PinCardTagRow } from "./pin-card";

const meta = {
  title: "Pin card",
  component: PinCard,
  ...componentStoryMeta(
    "Masonry pin cards for map gallery views.",
    "Uses the same column grid as map cards. Cover photos keep their natural aspect ratio with title and metadata below.",
  ),
  args: {
    to: "/alex/europe/pin/naivasha",
    title: "Lake Naivasha",
    description: "Boat ride among hippos and fish eagles at sunrise.",
    coverUrl:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&q=80&auto=format&fit=crop",
    dateLabel: "Jun 12, 2024",
    photoCountLabel: "8 photos",
    tags: (
      <PinCardTagRow>
        <TagBadge style={{ backgroundColor: "#3d9970", color: "white" }}>
          Safari
        </TagBadge>
      </PinCardTagRow>
    ),
  },
  decorators: [withMemoryRouter],
} satisfies Meta<typeof PinCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutCover: Story = {
  args: {
    coverUrl: null,
    title: "Hell's Gate",
    description: "Cycling through the gorge.",
    dateLabel: "Jun 14, 2024",
    photoCountLabel: undefined,
    tags: (
      <PinCardTagRow>
        <TagBadge style={{ backgroundColor: "#ff851b", color: "white" }}>
          Hike
        </TagBadge>
      </PinCardTagRow>
    ),
  },
};

export const MasonryGrid: Story = {
  render: () => (
    <MapCardMasonryGrid columns={4}>
      <PinCard
        to="/alex/europe/pin/a"
        title="Lake Naivasha"
        coverUrl="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80&auto=format&fit=crop"
        dateLabel="Jun 12"
        photoCountLabel="8 photos"
        tags={
          <PinCardTagRow>
            <TagBadge style={{ backgroundColor: "#3d9970", color: "white" }}>
              Safari
            </TagBadge>
          </PinCardTagRow>
        }
      />
      <PinCard
        to="/alex/europe/pin/b"
        title="Hell's Gate"
        dateLabel="Jun 14"
        tags={
          <PinCardTagRow>
            <TagBadge style={{ backgroundColor: "#ff851b", color: "white" }}>
              Hike
            </TagBadge>
          </PinCardTagRow>
        }
      />
      <PinCard
        to="/alex/europe/pin/c"
        title="Masai Mara"
        coverUrl="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80&auto=format&fit=crop"
        dateLabel="Jun 18"
        photoCountLabel="24 photos"
      />
    </MapCardMasonryGrid>
  ),
  parameters: storyDocs("Gallery grid using `MapCardMasonryGrid`."),
};
