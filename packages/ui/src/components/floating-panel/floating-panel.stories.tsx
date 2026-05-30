import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Text } from "../text";
import { FloatingPanel } from "./floating-panel";

const meta = {
  title: "Components/Floating Panel",
  ...componentStoryMeta(
    `Glassmorphism panel for toolbars, login card, and map overlays.`,
    `Use \`padding="lg"\` and \`elevated\` for login and toolbars. Avoid nesting more than one elevated panel.`,
  ),
  component: FloatingPanel,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Glass panel with default padding."),
  render: () => (
    <StoryFrame width="md">
      <FloatingPanel>
        <Text variant="body">Floating panel content.</Text>
      </FloatingPanel>
    </StoryFrame>
  ),
};

export const LargePadding: Story = {
  parameters: storyDocs("Elevated panel with large padding."),
  render: () => (
    <StoryFrame width="md">
      <FloatingPanel padding="lg" elevated>
        <Text as="h2" variant="title">
          Elevated panel
        </Text>
        <Text variant="muted">With larger padding token.</Text>
      </FloatingPanel>
    </StoryFrame>
  ),
};
