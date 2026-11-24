import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { SecretReveal } from "./secret-reveal";

const meta = {
  title: "Secret Reveal",
  ...componentStoryMeta(
    `One-time display of a secret value (API key, token) with a copy button.`,
    `Pass \`value\` and an optional \`hint\` (e.g. "You won't see this again").`,
  ),
  component: SecretReveal,
  decorators: [
    (Story) => (
      <StoryFrame width="md">
        <Story />
      </StoryFrame>
    ),
  ],
  args: {
    value: "cur_live_3f9a1c0be2d84e6f9a7b5c3d1e0f2a4b6c8d0e1f2a3b4c5d",
    label: "API key",
  },
} satisfies Meta<typeof SecretReveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Secret with copy button."),
};

export const WithHint: Story = {
  parameters: storyDocs("Guidance below the value via `hint`."),
  args: {
    hint: "Copy this key now — it won't be shown again.",
  },
};
