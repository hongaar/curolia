import type { Meta, StoryObj } from "@storybook/react";
import { X } from "lucide-react";
import { useState } from "react";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { CardAction, CardContent, CardHeader, CardTitle } from "../card";
import { BottomSheet } from "./bottom-sheet";

const meta = {
  title: "Bottom sheet",
  ...componentStoryMeta(
    "Draggable mobile bottom sheet with partial and full-height snaps.",
    "Drag the handle up to expand, down to collapse or dismiss. Browser back closes the sheet when `syncHistoryBack` is enabled.",
  ),
  component: BottomSheet,
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function DemoSheet() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open bottom sheet
      </Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Example sheet"
        partialHeight="min(70dvh, 28rem)"
      >
        <div style={{ padding: "0 1rem 1.5rem" }}>
          <p style={{ marginTop: 0 }}>
            Drag the handle to expand this sheet or pull down to close it.
          </p>
          {Array.from({ length: 12 }, (_, index) => (
            <p key={index}>Scrollable body content line {index + 1}.</p>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

export const Default: Story = {
  parameters: storyDocs("Interactive sheet with history-backed dismissal."),
  render: () => <DemoSheet />,
};

function CardHeaderCloseDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open bottom sheet
      </Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Pin details"
        overlay="none"
        containBody
        partialHeight="min(70dvh, 28rem)"
      >
        <CardHeader>
          <CardTitle>Sirtaki</CardTitle>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p style={{ marginTop: 0 }}>
            Focus the close button — the ring should not clip against the sheet
            edge.
          </p>
          {Array.from({ length: 8 }, (_, index) => (
            <p key={index}>Scrollable body content line {index + 1}.</p>
          ))}
        </CardContent>
      </BottomSheet>
    </>
  );
}

export const CardHeaderClose: Story = {
  parameters: storyDocs(
    "Card header with a trailing close control inside the sheet body inset.",
  ),
  render: () => <CardHeaderCloseDemo />,
};
