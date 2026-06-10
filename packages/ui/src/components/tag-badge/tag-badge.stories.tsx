import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { TagBadge } from "./tag-badge";

const meta = {
  title: "Tag Badge",
  ...componentStoryMeta(
    `Colored pill label for map tags on pins, blog posts, and popovers.`,
    `Import \`TagBadge\` and pass tag color via \`style\` (\`backgroundColor\`, \`color\`). Pair with a tag row wrapper from pin detail, blog, or map marker popover layout.`,
  ),
  component: TagBadge,
  args: { children: "Food" },
} satisfies Meta<typeof TagBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Plain tag badge without custom color."),
};

export const Colored: Story = {
  parameters: storyDocs("Tag color from map tag settings."),
  args: {
    children: "Paris",
    style: { background: "#3b82f6", color: "#fff" },
  },
};
