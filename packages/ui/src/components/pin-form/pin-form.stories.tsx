import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { FormField } from "../form-layout";
import { Input } from "../input";
import { Label } from "../label";
import { PinFormPanelCard } from "./pin-form";

const meta = {
  title: "Pin Form",
  ...componentStoryMeta(
    `Pin create/edit dialog layout and field groups.`,
    `Use \`PinFormPanelDialog\` for modals and \`PinFormPanelCard\` for map-anchored panels.`,
  ),
  component: PinFormPanelCard,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Pin create/edit panel card with footer actions."),
  render: () => (
    <StoryFrame width="md">
      <PinFormPanelCard
        title="Add pin"
        footer={
          <>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </>
        }
      >
        <FormField>
          <Label htmlFor="story-pin-title">Title</Label>
          <Input id="story-pin-title" placeholder="Visited place" />
        </FormField>
      </PinFormPanelCard>
    </StoryFrame>
  ),
};
