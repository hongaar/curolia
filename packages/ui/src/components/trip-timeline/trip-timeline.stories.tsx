import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { TripTimeline } from "./trip-timeline";

const TRIP = [
  { id: "paris", title: "Paris", color: "#2d6a5d", date: "2025-06-01" },
  { id: "lyon", title: "Lyon", color: "#c45c26", date: "2025-06-05" },
  { id: "nice", title: "Nice", color: "#3b6ea5", date: "2025-06-12" },
  { id: "barcelona", title: "Barcelona", color: "#8b4b9b", date: "2025-06-20" },
];

const meta = {
  title: "Trip timeline",
  ...componentStoryMeta(
    "Compact chronological trip overview with date-proportional stops.",
    "Dots use each pin's first tag color. Hover for the pin title; click to navigate.",
  ),
  component: TripTimeline,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <StoryFrame width="md">
          <Story />
        </StoryFrame>
      </MemoryRouter>
    ),
  ],
  args: {
    items: TRIP,
    currentId: "lyon",
    onSelect: () => undefined,
  },
} satisfies Meta<typeof TripTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiddleStop: Story = {
  parameters: storyDocs("Current stop is larger; spacing follows pin dates."),
};

export const FirstStop: Story = {
  args: { currentId: "paris" },
};

export const LastStop: Story = {
  args: { currentId: "barcelona" },
};

const LIGHT_TAG_TRIP = [
  { id: "a", title: "Nairobi", color: "#e53935", date: "2025-06-01" },
  { id: "b", title: "Mombasa", color: "#fff176", date: "2025-06-08" },
  { id: "c", title: "Lamu", color: "#81d4fa", date: "2025-06-15" },
  { id: "d", title: "Kisumu", color: "#f8bbd0", date: "2025-06-22" },
];

export const LightTagColors: Story = {
  args: { items: LIGHT_TAG_TRIP, currentId: "b" },
  parameters: storyDocs(
    "Inactive dots and the active ring use softened tag tints mixed with card so light colors stay distinguishable.",
  ),
};
