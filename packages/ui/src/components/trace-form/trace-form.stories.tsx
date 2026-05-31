import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { FormField } from "../form-layout";
import { TraceFormPanelCard } from "./trace-form";

const meta = {
  title: "Trace Form",
  ...componentStoryMeta(
    `Trace create/edit dialog layout and field groups.`,
    `Compose inside \`PanelDialogContent\` for add/edit trace flows.`,
  ),
  component: TraceFormPanelCard,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Trace create/edit panel card with footer actions."),
  render: () => (
    <StoryFrame width="md">
      <TraceFormPanelCard
        title="Add trace"
        footer={
          <>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </>
        }
      >
        <FormField>
          <Label htmlFor="story-trace-title">Title</Label>
          <Input id="story-trace-title" placeholder="Visited place" />
        </FormField>
      </TraceFormPanelCard>
    </StoryFrame>
  ),
};
