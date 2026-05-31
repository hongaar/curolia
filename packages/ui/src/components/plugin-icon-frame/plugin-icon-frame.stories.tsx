import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { PluginIconFrame } from "./plugin-icon-frame";

const icon = <span aria-hidden>📍</span>;

const meta = {
  title: "Plugin Icon Frame",
  ...componentStoryMeta(
    `Sized frame for plugin SVG or emoji icons in lists.`,
    `Set \`size\` to \`4\`, \`5\`, or \`6\` (rem-based). Place icon markup in \`children\`.`,
  ),
  component: PluginIconFrame,
  args: { children: icon },
} satisfies Meta<typeof PluginIconFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Size4: Story = {
  parameters: storyDocs("`size={4}` — default list icon frame."),
  args: { size: 4 },
};

export const Size5: Story = {
  parameters: storyDocs("`size={5}` — medium icon frame."),
  args: { size: 5 },
};

export const Size6: Story = {
  parameters: storyDocs("`size={6}` — large icon frame."),
  args: { size: 6 },
};
