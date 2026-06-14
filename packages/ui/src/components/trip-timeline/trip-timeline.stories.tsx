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
