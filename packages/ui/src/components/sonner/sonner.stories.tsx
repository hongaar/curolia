import type { Meta, StoryObj } from "@storybook/react";
import { toast } from "sonner";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryRow } from "../../storybook/story-frame";
import { Button } from "../button";
import { Toaster } from "./sonner";

const meta = {
  title: "Sonner Toaster",
  ...componentStoryMeta(
    `Global toast host; call \`toast()\` from app code.`,
    `Mount \`<Toaster />\` once near the app root. Trigger with \`toast.success\`, \`toast.error\`, etc.`,
  ),
  component: Toaster,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Toast host with buttons that fire sample toasts."),
  render: () => (
    <>
      <Toaster />
      <StoryRow>
        <Button variant="outline" onClick={() => toast("Event saved")}>
          Default
        </Button>
        <Button onClick={() => toast.success("Pin saved")}>Success</Button>
        <Button
          variant="outline"
          onClick={() => toast.error("Could not save pin")}
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning("Map is read-only")}
        >
          Warning
        </Button>
        <Button variant="outline" onClick={() => toast.info("Syncing photos…")}>
          Info
        </Button>
        <Button variant="outline" onClick={() => toast.loading("Uploading…")}>
          Loading
        </Button>
      </StoryRow>
    </>
  ),
};
