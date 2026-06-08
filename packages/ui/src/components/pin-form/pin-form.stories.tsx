import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { PinFormPhotoSortableGrid, PinFormPhotoThumb } from "./pin-form";

const meta = {
  title: "Pin Form",
  ...componentStoryMeta(
    `Pin editor field groups and photo reorder UI.`,
    `Use \`DialogContent\` / \`DialogBody\` for modals and \`modal={false}\` for map panels (see Dialog stories).`,
  ),
  component: PinFormPhotoSortableGrid,
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
