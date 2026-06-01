import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { Dialog, DialogTrigger } from "../dialog";
import { Input } from "../input";
import { Label } from "../label";
import {
  PanelDialogContent,
  PanelDialogField,
  PanelDialogFooterRow,
  PanelDialogFormStack,
  PanelDialogTitle,
} from "./panel-dialog";

const meta = {
  title: "Panel Dialog",
  ...componentStoryMeta(
    `Wide dialog variant for pin forms and map actions.`,
    `Use exported \`PanelDialogContent\` wrappers instead of raw \`DialogContent\` sizing.`,
  ),
  component: PanelDialogContent,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Wide dialog content for map and pin forms."),
  render: () => (
    <StoryFrame width="md">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Open
        </DialogTrigger>
        <PanelDialogContent size="md">
          <PanelDialogTitle>New map</PanelDialogTitle>
          <PanelDialogFormStack>
            <PanelDialogField>
              <Label htmlFor="story-map-name">Name</Label>
              <Input id="story-map-name" placeholder="Summer 2025" />
            </PanelDialogField>
          </PanelDialogFormStack>
          <PanelDialogFooterRow>
            <Button variant="outline">Cancel</Button>
            <Button>Create</Button>
          </PanelDialogFooterRow>
        </PanelDialogContent>
      </Dialog>
    </StoryFrame>
  ),
};
