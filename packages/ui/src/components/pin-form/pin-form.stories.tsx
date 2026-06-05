import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { FormField } from "../form-layout";
import { Input } from "../input";
import { Label } from "../label";
import {
  PinFormPanelCard,
  PinFormPhotoSortableGrid,
  PinFormPhotoThumb,
} from "./pin-form";

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

export const PhotoReorder: Story = {
  parameters: storyDocs("Drag the grip handle to reorder photo thumbnails."),
  render: function Render() {
    const [items, setItems] = useState([
      { id: "a", label: "Sunset", color: "#f4a261" },
      { id: "b", label: "Harbor", color: "#2a9d8f" },
      { id: "c", label: "Street", color: "#264653" },
      { id: "d", label: "Cafe", color: "#e9c46a" },
    ]);

    return (
      <StoryFrame width="md">
        <PinFormPhotoSortableGrid
          items={items}
          getItemId={(item) => item.id}
          onReorder={setItems}
          renderItem={(item, { dragHandle }) => (
            <PinFormPhotoThumb dragHandle={dragHandle}>
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "100%",
                  height: "100%",
                  background: item.color,
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>
            </PinFormPhotoThumb>
          )}
        />
      </StoryFrame>
    );
  },
};

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
