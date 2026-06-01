import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Textarea } from "./textarea";

const meta = {
  title: "Textarea",
  ...componentStoryMeta(
    `Multi-line text input.`,
    `Associate with \`Label\`. Use for descriptions and long-form map fields.`,
  ),
  component: Textarea,
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Multi-line text input."),
  args: { placeholder: "Write a description…" },
};

export const Disabled: Story = {
  parameters: storyDocs("Disabled state blocks editing."),
  args: { placeholder: "Cannot edit", disabled: true },
};

export const Invalid: Story = {
  parameters: storyDocs("`aria-invalid` shows error styling."),
  args: {
    placeholder: "Description required",
    "aria-invalid": true,
  },
};
