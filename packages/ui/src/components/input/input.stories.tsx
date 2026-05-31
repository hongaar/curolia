import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Input } from "./input";

const meta = {
  title: "Input",
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

export const TypeEmail: Story = {
  parameters: storyDocs('Native `type="email"` for email fields.'),
  args: { type: "email", placeholder: "you@example.com" },
};

export const Disabled: Story = {
  parameters: storyDocs("Disabled state blocks editing."),
  args: { placeholder: "Cannot edit", disabled: true },
};

export const Invalid: Story = {
  parameters: storyDocs("`aria-invalid` shows error styling."),
  args: {
    placeholder: "Required",
    "aria-invalid": true,
    defaultValue: "",
  },
};
