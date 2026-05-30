import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Box } from "../box";
import { Stack } from "./stack";
import { Text } from "../text";

const meta = {
  title: "Components/Stack",
  ...componentStoryMeta(
    `Flex layout primitive for vertical or horizontal spacing.`,
    `Set \`direction\`, \`gap\`, and \`align\` instead of utility classes. Nests with \`Box\` and \`Text\` for page structure.`,
  ),
  component: Stack,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Vertical stack with default gap."),
  render: () => (
    <Stack gap="md">
      <Text variant="body">First item</Text>
      <Text variant="muted">Second item</Text>
    </Stack>
  ),
};

export const Row: Story = {
  parameters: storyDocs("Horizontal stack layout."),
  render: () => (
    <Stack direction="row" gap="sm" align="center">
      <Box variant="shrink0">A</Box>
      <Text variant="body">Row layout with gap sm</Text>
    </Stack>
  ),
};
