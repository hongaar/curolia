import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { PinSequenceNav, type PinSequenceNavItem } from "./pin-sequence-nav";

const TRIP_STOPS: PinSequenceNavItem[] = [
  { id: "paris", title: "Paris", color: "#2d6a5d" },
  { id: "lyon", title: "Lyon", color: "#c45c26" },
  { id: "nice", title: "Nice", color: "#3b6ea5" },
  { id: "barcelona", title: "Barcelona", color: "#8b4b9b" },
];

const meta = {
  title: "Pin sequence nav",
  ...componentStoryMeta(
    "Chronological trip navigation for dated pins: colored progress dots plus previous/next links.",
    "Render below pin detail tags when a map has two or more dated pins. Dot colors come from each pin's first tag; pass `previous` / `next` with `href` or `onClick` for navigation.",
  ),
  component: PinSequenceNav,
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
    items: TRIP_STOPS,
    currentIndex: 1,
    previous: { title: "Paris", href: "#paris" },
    next: { title: "Nice", href: "#nice" },
  },
} satisfies Meta<typeof PinSequenceNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiddleStop: Story = {
  parameters: storyDocs(
    "Typical case: previous and next pin titles with link endpoints.",
  ),
};

export const FirstStop: Story = {
  parameters: storyDocs("First stop in the sequence — next link only."),
  args: {
    currentIndex: 0,
    previous: null,
    next: { title: "Lyon", href: "#lyon" },
  },
};

export const LastStop: Story = {
  parameters: storyDocs("Last stop in the sequence — previous link only."),
  args: {
    currentIndex: 3,
    previous: { title: "Nice", href: "#nice" },
    next: null,
  },
};

export const DotsOnly: Story = {
  parameters: storyDocs("Progress dots without prev/next links."),
  args: {
    previous: null,
    next: null,
  },
};

export const EndpointsOnly: Story = {
  parameters: storyDocs(
    "Prev/next links without dots — used on mobile detail and map side sheet.",
  ),
  args: {
    showDots: false,
  },
};

export const ManyStops: Story = {
  parameters: storyDocs(
    "Long sequences condense to nearby stops; collapsed markers hint at hidden pins.",
  ),
  args: {
    items: [
      ...TRIP_STOPS,
      { id: "madrid", title: "Madrid", color: "#b83232" },
      { id: "lisbon", title: "Lisbon", color: "#d4a017" },
      { id: "porto", title: "Porto", color: "#4a6fa5" },
    ],
    currentIndex: 3,
    previous: { title: "Nice", href: "#nice" },
    next: { title: "Barcelona", href: "#barcelona" },
  },
};

export const Interactive: Story = {
  parameters: storyDocs(
    "Click dots to move the active stop; prev/next titles update.",
  ),
  render: function Render() {
    const [{ currentIndex }, updateArgs] = useStoryArgs<{
      currentIndex: number;
    }>();
    const items = TRIP_STOPS;
    const previous =
      currentIndex > 0
        ? {
            title: items[currentIndex - 1]!.title,
            onClick: () => updateArgs({ currentIndex: currentIndex - 1 }),
          }
        : null;
    const next =
      currentIndex < items.length - 1
        ? {
            title: items[currentIndex + 1]!.title,
            onClick: () => updateArgs({ currentIndex: currentIndex + 1 }),
          }
        : null;

    return (
      <PinSequenceNav
        items={items}
        currentIndex={currentIndex}
        previous={previous}
        next={next}
        onSelectIndex={(index) => updateArgs({ currentIndex: index })}
      />
    );
  },
  args: {
    currentIndex: 1,
    previous: undefined,
    next: undefined,
  },
};
