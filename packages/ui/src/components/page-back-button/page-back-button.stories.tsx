import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { PageBackButton } from "./page-back-button";

const meta = {
  title: "Page Back Button",
  ...componentStoryMeta(
    `Ghost icon button for nested settings navigation.`,
    `Pass \`onClick\` to return to the parent route or panel.`,
  ),
  component: PageBackButton,
} satisfies Meta<typeof PageBackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Ghost icon button for nested settings navigation."),
  args: {
    label: "Back",
    onClick: () => undefined,
  },
};

export const CustomLabel: Story = {
  parameters: storyDocs("Custom `label` for context-specific navigation."),
  args: {
    label: "Map settings",
    onClick: () => undefined,
  },
};
