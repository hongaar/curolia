import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { PinFormFloatingHost } from "../pin-form";
import {
  Dialog,
  DialogBody,
  DialogCardTitle,
  DialogContent,
  DialogDescription,
  DialogField,
  DialogFooter,
  DialogFooterEnd,
  DialogFooterRow,
  DialogFooterStart,
  DialogFormStack,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "Dialog",
  ...componentStoryMeta(
    `Modal overlay for confirmations and focused tasks.`,
    `Use \`DialogTrigger\` + \`DialogContent\`. Compose \`DialogHeader\`, optional \`DialogBody\` (scrolls when long), and \`DialogFooter\`. Pass \`modal={false}\` for map-anchored panels. Set \`size="wide"\` for wider forms.`,
  ),
  component: Dialog,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Modal opened from a trigger button."),
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const NoCloseButton: Story = {
  parameters: storyDocs(
    "`showCloseButton={false}` on `DialogHeader` — dismissal via actions only.",
  ),
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent>
        <DialogHeader showCloseButton={false}>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>Choose an action to continue.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const NoDescription: Story = {
  parameters: storyDocs(
    "Without DialogDescription — default dialog with no description.",
  ),
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const FooterCloseButton: Story = {
  parameters: storyDocs(
    "`DialogFooter showCloseButton` adds a dismiss action.",
  ),
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent>
        <DialogHeader showCloseButton={false}>
          <DialogTitle>About this map</DialogTitle>
          <DialogDescription>Read-only information panel.</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Form: Story = {
  parameters: storyDocs(
    "Form dialog — `DialogBody` scrolls when content exceeds max height.",
  ),
  render: () => (
    <StoryFrame width="md">
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" />}>
          Open
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New map</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogFormStack>
              <DialogField>
                <Label htmlFor="story-map-name">Name</Label>
                <Input id="story-map-name" placeholder="Summer 2025" />
              </DialogField>
            </DialogFormStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StoryFrame>
  ),
};

export const Embedded: Story = {
  parameters: storyDocs(
    "`modal={false}` — inline shell for map-anchored panels (no portal or overlay).",
  ),
  render: () => (
    <StoryFrame width="md">
      <DialogContent modal={false}>
        <DialogHeader showCloseButton>
          <DialogCardTitle>Add pin</DialogCardTitle>
        </DialogHeader>
        <DialogBody>
          <DialogFormStack>
            <DialogField>
              <Label htmlFor="story-embedded-title">Title</Label>
              <Input id="story-embedded-title" placeholder="Visited place" />
            </DialogField>
          </DialogFormStack>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </StoryFrame>
  ),
};

export const EmbeddedMapPin: Story = {
  parameters: storyDocs(
    "Map quick-add layout — `modal={false}` inside `PinFormFloatingHost` with split footer.",
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
              <Label htmlFor="story-map-pin-title">Title</Label>
              <Input id="story-map-pin-title" placeholder="Visited place" />
            </DialogField>
          </DialogBody>
          <DialogFooter between>
            <DialogFooterStart>
              <Button variant="outline">Delete</Button>
            </DialogFooterStart>
            <DialogFooterEnd>
              <Button variant="secondary">Edit</Button>
              <Button>Open</Button>
            </DialogFooterEnd>
          </DialogFooter>
        </DialogContent>
      </PinFormFloatingHost>
    </StoryFrame>
  ),
};

export const FooterRow: Story = {
  parameters: storyDocs("Footer row helper for non-modal footers."),
  render: () => (
    <StoryFrame width="md">
      <DialogFooterRow>
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </DialogFooterRow>
    </StoryFrame>
  ),
};

export const ControlledOpen: Story = {
  parameters: storyDocs("Controlled `open` via story args."),
  args: { open: false },
  render: function Render() {
    const [{ open }, updateArgs] = useStoryArgs<{ open: boolean }>();
    return (
      <>
        <Button variant="outline" onClick={() => updateArgs({ open: true })}>
          Open controlled dialog
        </Button>
        <Dialog open={open} onOpenChange={(next) => updateArgs({ open: next })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Controlled dialog</DialogTitle>
              <DialogDescription>
                Toggle `open` from the Controls panel.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => updateArgs({ open: false })}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};
