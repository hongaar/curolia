import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryRow } from "../../storybook/story-frame";
import { Button } from "./button";

const meta = {
  title: "Components/Button",
  ...componentStoryMeta(
    `Primary interactive control built on Base UI with Curolia tokens.`,
    `Use \`variant\` and \`size\` for hierarchy. For links styled as buttons, use \`variant="link"\`. Icon-only actions use \`size="icon"\` variants. Compose with \`render\` when wrapping a custom element.`,
  ),
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Primary button with default variant and size."),
  args: {
    children: "Button",
  },
};

export const Outline: Story = {
  parameters: storyDocs("Secondary action with outline styling."),
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const Sizes: Story = {
  parameters: storyDocs(
    "Comparison of `size` tokens, including icon-only buttons.",
  ),
  render: () => (
    <StoryRow>
      <Button size="xs">XS</Button>
      <Button size="sm">SM</Button>
      <Button size="default">Default</Button>
      <Button size="lg">LG</Button>
      <Button size="icon" aria-label="Icon">
        +
      </Button>
      <Button size="icon-sm" aria-label="Icon small">
        +
      </Button>
    </StoryRow>
  ),
};
