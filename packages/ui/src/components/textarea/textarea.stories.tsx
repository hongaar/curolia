import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Textarea } from "./textarea";

const meta = {
  title: "Components/Textarea",
  ...componentStoryMeta(
    `Multi-line text input.`,
    `Associate with \`Label\`. Use for descriptions and long-form journal fields.`,
  ),
  component: Textarea,
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Multi-line text input."),
  args: { placeholder: "Write a description…" },
};
