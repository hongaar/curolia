import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryRow } from "../../storybook/story-frame";
import { PluginIconFrame } from "./plugin-icon-frame";

const icon = <span aria-hidden>📍</span>;

const meta = {
  title: "Components/Plugin Icon Frame",
  ...componentStoryMeta(
    `Sized frame for plugin SVG or emoji icons in lists.`,
    `Set \`size\` to \`4\`, \`5\`, or \`6\` (rem-based). Place icon markup in \`children\`.`,
  ),
  component: PluginIconFrame,
  args: { children: icon, size: 4 as const },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Default icon frame (size 4)."),
};

export const Sizes: Story = {
  parameters: storyDocs("Icon frame size tokens 4, 5, and 6."),
  render: () => (
    <StoryRow>
      <PluginIconFrame size={4}>{icon}</PluginIconFrame>
      <PluginIconFrame size={5}>{icon}</PluginIconFrame>
      <PluginIconFrame size={6}>{icon}</PluginIconFrame>
    </StoryRow>
  ),
};
