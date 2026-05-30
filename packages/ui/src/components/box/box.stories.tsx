import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryColumn, StoryFrame } from "../../storybook/story-frame";
import { Text } from "../text";
import { Box } from "./box";

const meta = {
  title: "Components/Box",
  ...componentStoryMeta(
    `Layout container applying named surface and sizing variants.`,
    `Pass \`variant\` as a token or array (e.g. \`bgBackground\`, \`maxWidthMd\`). Avoid ad-hoc \`className\` in app code.`,
  ),
  component: Box,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Layout box with background and max-width tokens."),
  render: () => (
    <StoryFrame width="md">
      <Box variant={["bgBackground", "maxWidthMd", "paddingNavShell"]}>
        <Text variant="body">Box with layout variants.</Text>
      </Box>
    </StoryFrame>
  ),
};
