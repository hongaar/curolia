import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  ...componentStoryMeta(
    `Small status or category label for traces, plugins, and filters.`,
    `Use \`variant\` for semantic color. Prefer short text; pair with icons only when the meaning is not clear from the label alone.`,
  ),
  component: Badge,
  args: { children: "New" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Default badge for status or category labels."),
};

export const Secondary: Story = {
  parameters: storyDocs('`variant="secondary"` for neutral metadata.'),
  args: { variant: "secondary", children: "Secondary" },
};

export const Outline: Story = {
  parameters: storyDocs('`variant="outline"` with border emphasis.'),
  args: { variant: "outline", children: "Outline" },
};

export const Destructive: Story = {
  parameters: storyDocs('`variant="destructive"` for errors or removal.'),
  args: { variant: "destructive", children: "Destructive" },
};

export const Ghost: Story = {
  parameters: storyDocs('`variant="ghost"` on busy backgrounds.'),
  args: { variant: "ghost", children: "Ghost" },
};

export const Link: Story = {
  parameters: storyDocs('`variant="link"` for inline badge links.'),
  args: { variant: "link", children: "Link" },
};
