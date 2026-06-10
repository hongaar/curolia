import type { Meta, StoryObj } from "@storybook/react";
import {
  componentStoryMeta,
  storyArgTypes,
  storyDocs,
} from "../../storybook/docs";
import { StoryRow } from "../../storybook/story-frame";
import { Button } from "./button";

const meta = {
  title: "Button",
  ...componentStoryMeta(
    `Primary interactive control built on Base UI with Curolia tokens.`,
    `Use \`variant\` and \`size\` for hierarchy. For links styled as buttons, use \`variant="link"\`. Icon-only actions use \`size="icon"\` variants. Compose with \`render\` when wrapping a custom element (e.g. a router \`Link\`); \`nativeButton\` defaults to \`false\` in that case—set it explicitly only when \`render\` uses a real \`<button>\`.`,
    {
      argTypes: storyArgTypes({
        nativeButton:
          "Whether the rendered element is a native `<button>`. Defaults to `false` when `render` is set, otherwise `true`.",
      }),
    },
  ),
  component: Button,
  args: { children: "Button" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Primary button with default variant and size."),
};

export const Outline: Story = {
  parameters: storyDocs('`variant="outline"` for secondary actions.'),
  args: { variant: "outline" },
};

export const Secondary: Story = {
  parameters: storyDocs('`variant="secondary"` for lower-emphasis actions.'),
  args: { variant: "secondary" },
};

export const Ghost: Story = {
  parameters: storyDocs('`variant="ghost"` on tinted surfaces.'),
  args: { variant: "ghost" },
};

export const Destructive: Story = {
  parameters: storyDocs('`variant="destructive"` for irreversible actions.'),
  args: { variant: "destructive" },
};

export const Link: Story = {
  parameters: storyDocs('`variant="link"` for inline text actions.'),
  args: { variant: "link" },
};

export const Disabled: Story = {
  parameters: storyDocs("Disabled state blocks interaction."),
  args: { disabled: true },
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
