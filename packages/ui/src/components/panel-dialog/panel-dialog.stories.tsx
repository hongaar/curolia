import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { Dialog, DialogTrigger } from "../dialog";
import { Input } from "../input";
import { Label } from "../label";
import {
  PanelDialogBody,
  PanelDialogContent,
  PanelDialogField,
  PanelDialogFooter,
  PanelDialogFooterRow,
  PanelDialogFormStack,
  PanelDialogHeader,
  PanelDialogTitle,
} from "./panel-dialog";

const meta = {
  title: "Panel Dialog",
  ...componentStoryMeta(
    `Panel dialogs share max width, max height, and a scrollable body.`,
    `Use \`PanelDialogContent\`, \`PanelDialogBody\` (scrollable main), and \`PanelDialogFooter\`.`,
  ),
  component: PanelDialogContent,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Standard panel dialog layout."),
  render: () => (
    <StoryFrame width="md">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Open
        </DialogTrigger>
        <PanelDialogContent>
          <PanelDialogHeader>
            <PanelDialogTitle>New map</PanelDialogTitle>
          </PanelDialogHeader>
          <PanelDialogBody>
            <PanelDialogFormStack>
              <PanelDialogField>
                <Label htmlFor="story-map-name">Name</Label>
                <Input id="story-map-name" placeholder="Summer 2025" />
              </PanelDialogField>
            </PanelDialogFormStack>
          </PanelDialogBody>
          <PanelDialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Create</Button>
          </PanelDialogFooter>
        </PanelDialogContent>
      </Dialog>
    </StoryFrame>
  ),
};

export const FooterRow: Story = {
  parameters: storyDocs("Footer row helper for non-modal footers."),
  render: () => (
    <StoryFrame width="md">
      <PanelDialogFooterRow>
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </PanelDialogFooterRow>
    </StoryFrame>
  ),
};
