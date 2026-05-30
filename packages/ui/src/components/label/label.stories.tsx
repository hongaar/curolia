import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryColumn, StoryFrame } from "../../storybook/story-frame";
import { Input } from "../input";
import { Label } from "./label";

const meta = {
  title: "Components/Label",
  ...componentStoryMeta(
    `Accessible caption for form controls.`,
    `Set \`htmlFor\` to the control \`id\`. Can wrap inputs for checkbox/switch rows.`,
  ),
  component: Label,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Label associated with a text input."),
  render: () => (
    <StoryFrame width="sm">
      <StoryColumn>
        <Label htmlFor="story-label-input">Email</Label>
        <Input
          id="story-label-input"
          type="email"
          placeholder="you@example.com"
        />
      </StoryColumn>
    </StoryFrame>
  ),
};
