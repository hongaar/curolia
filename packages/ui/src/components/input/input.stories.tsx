import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Input } from "./input";

const meta = {
  title: "Components/Input",
  ...componentStoryMeta(
    `Single-line text field with focus ring and invalid styling.`,
    `Always associate with \`Label\` via \`id\` / \`htmlFor\`. Use native \`type\` for email, password, etc.`,
  ),
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Single-line text field."),
  args: { placeholder: "Enter text…" },
};

export const Disabled: Story = {
  parameters: storyDocs("Disabled story."),
  args: { placeholder: "Cannot edit", disabled: true },
};
