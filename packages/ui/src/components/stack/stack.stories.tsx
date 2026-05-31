import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Box } from "../box";
import { Text } from "../text";
import { Stack } from "./stack";

const meta = {
  title: "Stack",
  ...componentStoryMeta(
    `Flex layout primitive for vertical or horizontal spacing.`,
    `Set \`direction\`, \`gap\`, and \`align\` instead of utility classes. Nests with \`Box\` and \`Text\` for page structure.`,
  ),
  component: Stack,
  args: {
    children: (
      <>
        <Text variant="body">First item</Text>
        <Text variant="muted">Second item</Text>
      </>
    ),
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Vertical stack with default gap."),
  args: { gap: "md" },
};

export const DirectionRow: Story = {
  parameters: storyDocs('`direction="row"` for horizontal layouts.'),
  args: { direction: "row", gap: "sm", align: "center" },
  render: (args) => (
    <Stack {...args}>
      <Box variant="shrink0">A</Box>
      <Text variant="body">Row layout</Text>
    </Stack>
  ),
};

export const GapLarge: Story = {
  parameters: storyDocs('`gap="lg"` spacing between children.'),
  args: { gap: "lg" },
};

export const AlignCenter: Story = {
  parameters: storyDocs('`align="center"` on the cross axis.'),
  args: { direction: "row", gap: "sm", align: "center" },
  render: (args) => (
    <StoryFrame width="sm">
      <Stack {...args}>
        <Box variant="shrink0">Short</Box>
        <Text variant="body">Taller text line for alignment</Text>
      </Stack>
    </StoryFrame>
  ),
};

export const JustifyBetween: Story = {
  parameters: storyDocs('`justify="between"` spreads items on the main axis.'),
  args: { direction: "row", justify: "between" },
  render: (args) => (
    <StoryFrame width="md">
      <Stack {...args}>
        <Text variant="body">Start</Text>
        <Text variant="body">End</Text>
      </Stack>
    </StoryFrame>
  ),
};

export const PaddingMedium: Story = {
  parameters: storyDocs('`padding="md"` on the stack container.'),
  args: { gap: "sm", padding: "md" },
};

export const Fill: Story = {
  parameters: storyDocs("`fill` lets the stack grow in flex parents."),
  args: { fill: true, gap: "sm" },
  render: (args) => (
    <StoryFrame width="md">
      <div style={{ display: "flex", minHeight: 120 }}>
        <Stack {...args}>
          <Text variant="body">Grows to fill</Text>
        </Stack>
      </div>
    </StoryFrame>
  ),
};

export const Wrap: Story = {
  parameters: storyDocs("`wrap` allows items to flow to the next line."),
  args: { direction: "row", gap: "sm", wrap: true },
  render: (args) => (
    <StoryFrame width="sm">
      <Stack {...args}>
        {["One", "Two", "Three", "Four"].map((label) => (
          <Box key={label} variant="shrink0">
            {label}
          </Box>
        ))}
      </Stack>
    </StoryFrame>
  ),
};
