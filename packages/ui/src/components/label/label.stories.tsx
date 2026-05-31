import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryColumn, StoryFrame } from "../../storybook/story-frame";
import { Checkbox } from "../checkbox";
import { Input } from "../input";
import { Label } from "./label";

const meta = {
  title: "Components/Label",
  ...componentStoryMeta(
    `Accessible caption for form controls.`,
    `Set \`htmlFor\` to the control \`id\`. Can wrap inputs for checkbox/switch rows.`,
  ),
  component: Label,
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HtmlFor: Story = {
  parameters: storyDocs("`htmlFor` associates the label with a control `id`."),
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

export const WrappingControl: Story = {
  parameters: storyDocs("Label wrapping a control for checkbox/switch rows."),
  render: () => (
    <StoryFrame width="sm">
      <Label>
        <Checkbox defaultChecked={false} />
        Remember me
      </Label>
    </StoryFrame>
  ),
};
