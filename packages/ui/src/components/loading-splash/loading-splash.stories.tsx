import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { CuroliaLoadingSplash } from "./loading-splash";

const meta = {
  title: "Components/Loading Splash",
  ...componentStoryMeta(
    `Full-viewport branded loader while auth or journal data resolves.`,
    `Render once in the protected route layout until the app is ready.`,
  ),
  component: CuroliaLoadingSplash,
} satisfies Meta<typeof CuroliaLoadingSplash>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Default loading splash with delayed logo reveal."),
};

export const StatusLabel: Story = {
  parameters: storyDocs("Custom `statusLabel` for screen readers."),
  args: { statusLabel: "Loading your journal" },
};

export const Fill: Story = {
  parameters: storyDocs("`fill` expands the splash to the parent viewport."),
  args: { fill: true },
  render: (args) => (
    <StoryFrame width="md">
      <div style={{ minHeight: 200 }}>
        <CuroliaLoadingSplash {...args} />
      </div>
    </StoryFrame>
  ),
};
