import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import {
  DialogBody,
  DialogCardTitle,
  DialogContent,
  DialogField,
  DialogFooter,
  DialogHeader,
} from "../dialog";
import { Input } from "../input";
import { Label } from "../label";
import {
  PinFormFloatingHost,
  PinFormPanelFieldGroup,
  PinFormPluginSectionCard,
} from "./pin-form";

const meta = {
  title: "Pin Form",
  ...componentStoryMeta(
    `Pin editor layout primitives (field groups, plugin section cards, floating host).`,
    `Photo reorder, file upload, and bullet lists live in their own components — see Photo Grid, File Upload, and Bullet List stories.`,
  ),
  component: PinFormPanelFieldGroup,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const PluginSection: Story = {
  parameters: storyDocs(
    "Plugin-owned fields inside a small card with icon + title.",
  ),
  render: () => (
    <StoryFrame width="md">
      <PinFormPluginSectionCard icon={<span>📍</span>} title="Location">
        <PinFormPanelFieldGroup>
          <div>Plugin fields render here.</div>
        </PinFormPanelFieldGroup>
      </PinFormPluginSectionCard>
    </StoryFrame>
  ),
};

export const FloatingHost: Story = {
  parameters: storyDocs(
    "Map-anchored floating shell — pointer-events split so the host does not block map clicks.",
  ),
  render: () => (
    <StoryFrame width="md">
      <PinFormFloatingHost>
        <DialogContent modal={false}>
          <DialogHeader showCloseButton>
            <DialogCardTitle>New pin</DialogCardTitle>
          </DialogHeader>
          <DialogBody>
            <DialogField>
              <Label htmlFor="pin-form-story-title">Title</Label>
              <Input id="pin-form-story-title" placeholder="Visited place" />
            </DialogField>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </PinFormFloatingHost>
    </StoryFrame>
  ),
};
