import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryColumn, StoryFrame } from "../../storybook/story-frame";
import { Text } from "./text";

const meta = {
  title: "Components/Text",
  ...componentStoryMeta(
    `Typography primitive with display, title, body, and muted variants.`,
    `Set \`as\` for semantic HTML (\`h1\`, \`p\`, …) and \`variant\` for styling. Combine variants: \`variant={["display", "titleLg", "center"]}\``,
  ),
  component: Text,
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Body text with default typography."),
  args: { children: "Trace journal entry body text." },
};

export const Muted: Story = {
  parameters: storyDocs("Muted story."),
  args: {
    variant: "muted",
    children: "Secondary helper or caption text.",
  },
};

export const DisplayTitle: Story = {
  parameters: storyDocs("Display typography for login-style headings."),
  render: () => (
    <StoryFrame width="sm">
      <StoryColumn>
        <Text as="h1" variant={["display", "titleLg", "center"]}>
          Curolia
        </Text>
        <Text variant={["muted", "center"]}>
          Sign in to your travel journal.
        </Text>
      </StoryColumn>
    </StoryFrame>
  ),
};
