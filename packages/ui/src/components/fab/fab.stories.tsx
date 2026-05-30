import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { FabButton } from "./fab";

const meta = {
  title: "Components/FAB",
  ...componentStoryMeta(
    `Generic floating action button; pass icon and label from the app.`,
    `Place inside map or page chrome; wire \`onClick\` and supply \`icon\` / \`label\`.`,
  ),
  component: FabButton,
} satisfies Meta<typeof FabButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs(
    "Floating action button; pass icon and label from the app.",
  ),
  args: {
    title: "Add trace",
    label: "Add trace",
    icon: <Plus aria-hidden />,
    onClick: () => undefined,
  },
};

export const Active: Story = {
  parameters: storyDocs("Pressed state for toggle-style FAB usage."),
  args: {
    active: true,
    title: "Cancel",
    label: "Cancel",
    icon: <Plus aria-hidden />,
    onClick: () => undefined,
  },
};
