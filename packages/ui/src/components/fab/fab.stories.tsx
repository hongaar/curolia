import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { FabButton } from "./fab";

const icon = <Plus aria-hidden />;

const meta = {
  title: "FAB",
  ...componentStoryMeta(
    `Generic floating action button; pass icon and label from the app.`,
    `Place inside map or page chrome; wire \`onClick\` and supply \`icon\` / \`label\`.`,
  ),
  component: FabButton,
  args: {
    title: "Add trace",
    label: "Add trace",
    icon,
    onClick: () => undefined,
  },
} satisfies Meta<typeof FabButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Default FAB with icon and label."),
};

export const Active: Story = {
  parameters: storyDocs(
    "`active` uses secondary styling for toggle-style FAB.",
  ),
  args: {
    active: true,
    title: "Cancel",
    label: "Cancel",
  },
};

export const Title: Story = {
  parameters: storyDocs("Native `title` tooltip on the button."),
  args: {
    title: "Add a new trace to this journal",
    label: "Add trace",
  },
};
