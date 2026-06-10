import type { Meta, StoryObj } from "@storybook/react";

import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { ProgressDots, type ProgressDotItem } from "./progress-dots";

const ONBOARDING_ITEMS: ProgressDotItem[] = Array.from(
  { length: 5 },
  (_, i) => ({
    id: String(i),
  }),
);

const COLORED_ITEMS: ProgressDotItem[] = [
  { id: "paris", label: "Paris", color: "#2d6a5d" },
  { id: "lyon", label: "Lyon", color: "#c45c26" },
  { id: "nice", label: "Nice", color: "#3b6ea5" },
  { id: "barcelona", label: "Barcelona", color: "#8b4b9b" },
];

const meta = {
  title: "Progress dots",
  ...componentStoryMeta(
    "Step indicator dots with optional per-dot colors and completed styling.",
    "Pass `items`, `currentIndex`, and optionally `onSelectIndex` for clickable dots. Used by onboarding (tone via `--primary`) and pin trip navigation (tag colors, `showCompletedStyle={false}`).",
  ),
  component: ProgressDots,
  decorators: [
    (Story) => (
      <StoryFrame width="sm">
        <Story />
      </StoryFrame>
    ),
  ],
  args: {
    items: ONBOARDING_ITEMS,
    currentIndex: 2,
    ariaLabel: "Progress",
    showCompletedStyle: true,
  },
} satisfies Meta<typeof ProgressDots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnboardingStyle: Story = {
  parameters: storyDocs(
    "Default tone dots with completed steps before the active pill.",
  ),
};

export const ColoredTripStops: Story = {
  parameters: storyDocs(
    "Per-dot colors (e.g. pin tag colors) without completed styling.",
  ),
  args: {
    items: COLORED_ITEMS,
    currentIndex: 1,
    showCompletedStyle: false,
    ariaLabel: "Trip stops",
  },
};

export const ReadOnly: Story = {
  parameters: storyDocs("Non-interactive dots — omit `onSelectIndex`."),
  args: {
    currentIndex: 0,
  },
};

export const Interactive: Story = {
  parameters: storyDocs(
    "Click dots to change the active step via `useStoryArgs`.",
  ),
  render: function Render() {
    const [{ currentIndex }, updateArgs] = useStoryArgs<{
      currentIndex: number;
    }>();

    return (
      <ProgressDots
        items={COLORED_ITEMS}
        currentIndex={currentIndex}
        showCompletedStyle={false}
        ariaLabel="Trip stops"
        onSelectIndex={(index) => updateArgs({ currentIndex: index })}
      />
    );
  },
  args: {
    currentIndex: 2,
  },
};
