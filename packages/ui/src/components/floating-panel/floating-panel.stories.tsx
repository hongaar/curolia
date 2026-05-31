import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Text } from "../text";
import { FloatingPanel } from "./floating-panel";

const meta = {
  title: "Floating Panel",
  ...componentStoryMeta(
    `Glassmorphism panel for toolbars, login card, and map overlays.`,
    `Use \`padding="lg"\` and \`elevated\` for login and toolbars. Avoid nesting more than one elevated panel.`,
  ),
  component: FloatingPanel,
  decorators: [
    (Story) => (
      <StoryFrame width="md">
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta<typeof FloatingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Default padding token."),
  args: {
    padding: "default",
    elevated: false,
    children: <Text variant="body">Floating panel content.</Text>,
  },
};

export const PaddingLarge: Story = {
  parameters: storyDocs('`padding="lg"` for login and toolbar shells.'),
  args: {
    padding: "lg",
    elevated: false,
    children: (
      <>
        <Text as="h2" variant="title">
          Large padding
        </Text>
        <Text variant="muted">Inner spacing uses the lg token.</Text>
      </>
    ),
  },
};

export const PaddingNone: Story = {
  parameters: storyDocs('`padding="none"` for flush inner content.'),
  args: {
    padding: "none",
    elevated: false,
    children: <Text variant="body">No inner padding.</Text>,
  },
};

export const Elevated: Story = {
  parameters: storyDocs("`elevated` adds stacking context for overlays."),
  args: {
    padding: "lg",
    elevated: true,
    children: (
      <>
        <Text as="h2" variant="title">
          Elevated panel
        </Text>
        <Text variant="muted">For toolbars and login card.</Text>
      </>
    ),
  },
};
