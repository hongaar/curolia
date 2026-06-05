import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "Dialog",
  ...componentStoryMeta(
    `Modal overlay for confirmations and focused tasks.`,
    `Use \`DialogTrigger\` + \`DialogContent\`. Set \`showCloseButton\` on \`DialogContent\` when users can dismiss without choosing an action.`,
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
    "`showCloseButton={false}` on `DialogContent` — dismissal via actions only.",
  ),
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
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

export const FooterCloseButton: Story = {
  parameters: storyDocs(
    "`DialogFooter showCloseButton` adds a dismiss action.",
  ),
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
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
