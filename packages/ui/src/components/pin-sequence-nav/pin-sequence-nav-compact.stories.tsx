import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { PinSequenceNavCompact } from "./pin-sequence-nav-compact";

const meta = {
  title: "Pin sequence nav compact",
  ...componentStoryMeta(
    "Icon-only previous/next controls for compact pin detail headers.",
    "Hover a button to see the neighboring pin title. Pass `href` for links or `onClick` for in-place navigation.",
  ),
  component: PinSequenceNavCompact,
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
    previous: { title: "Paris", href: "#paris" },
    next: { title: "Nice", href: "#nice" },
  },
} satisfies Meta<typeof PinSequenceNavCompact>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiddleStop: Story = {
  parameters: storyDocs("Both previous and next neighbors are available."),
};

export const FirstStop: Story = {
  parameters: storyDocs(
    "First stop — previous control is disabled to keep layout stable.",
  ),
  args: {
    previous: null,
    next: { title: "Lyon", href: "#lyon" },
  },
};

export const LastStop: Story = {
  parameters: storyDocs(
    "Last stop — next control is disabled to keep layout stable.",
  ),
  args: {
    previous: { title: "Nice", href: "#nice" },
    next: null,
  },
};

export const Interactive: Story = {
  parameters: storyDocs("Click controls to move through the trip."),
  render: function Render() {
    const stops = ["Paris", "Lyon", "Nice", "Barcelona"];
    const [{ index }, updateArgs] = useStoryArgs<{ index: number }>();
    const previous =
      index > 0
        ? {
            title: stops[index - 1]!,
            onClick: () => updateArgs({ index: index - 1 }),
          }
        : null;
    const next =
      index < stops.length - 1
        ? {
            title: stops[index + 1]!,
            onClick: () => updateArgs({ index: index + 1 }),
          }
        : null;

    return <PinSequenceNavCompact previous={previous} next={next} />;
  },
  args: {
    previous: undefined,
    next: undefined,
    index: 1,
  },
};
