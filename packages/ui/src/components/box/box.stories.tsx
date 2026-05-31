import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Text } from "../text";
import { Box } from "./box";

const meta = {
  title: "Box",
  ...componentStoryMeta(
    `Layout container applying named surface and sizing variants.`,
    `Pass \`variant\` as a token or array (e.g. \`bgBackground\`, \`maxWidthMd\`). Avoid ad-hoc \`className\` in app code.`,
  ),
  component: Box,
  args: {
    children: <Text variant="body">Box content</Text>,
  },
  decorators: [
    (Story) => (
      <StoryFrame width="md">
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Single `bgBackground` surface token."),
  args: { variant: "bgBackground" },
};

export const MaxWidthMd: Story = {
  parameters: storyDocs("`maxWidthMd` constrains content width."),
  args: { variant: ["bgBackground", "maxWidthMd", "paddingNavShell"] },
};

export const CombinedVariants: Story = {
  parameters: storyDocs("Multiple tokens composed as an array."),
  args: {
    variant: ["bgBackground", "maxWidthMd", "paddingNavShell", "textCenter"],
  },
};
