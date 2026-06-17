import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import {
  PhotoGrid,
  PhotoGridCoverButton,
  PhotoGridRemoveButton,
  PhotoGridThumb,
} from "./photo-grid";

const meta = {
  title: "Photo Grid",
  ...componentStoryMeta(
    `Thumbnail grid with optional drag-to-reorder.`,
    `Pass \`items\`, \`getItemId\`, \`onReorder\`, and \`renderItem\` for sortable mode; \`sortable\` defaults to enabled when there are multiple items.`,
  ),
  component: PhotoGrid,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Static: Story = {
  parameters: storyDocs(
    "Static grid — pass thumb children directly without sortable props.",
  ),
  render: () => (
    <StoryFrame width="md">
      <PhotoGrid>
        {["#f4a261", "#2a9d8f", "#264653"].map((color) => (
          <PhotoGridThumb key={color}>
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: "100%",
                height: "100%",
                background: color,
                color: "white",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Photo
            </div>
          </PhotoGridThumb>
        ))}
      </PhotoGrid>
    </StoryFrame>
  ),
};

export const Sortable: Story = {
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
        <PhotoGrid
          items={items}
          getItemId={(item) => item.id}
          onReorder={setItems}
          renderItem={(item, { dragHandle }) => (
            <PhotoGridThumb dragHandle={dragHandle}>
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
            </PhotoGridThumb>
          )}
        />
      </StoryFrame>
    );
  },
};

export const WithControls: Story = {
  parameters: storyDocs(
    "Hover controls: drag handle, map cover action, and remove.",
  ),
  render: function Render() {
    const [coverId, setCoverId] = useState<string | null>("b");

    return (
      <StoryFrame width="md">
        <PhotoGrid
          items={[
            { id: "a", label: "Sunset", color: "#f4a261" },
            { id: "b", label: "Harbor", color: "#2a9d8f" },
            { id: "c", label: "Street", color: "#264653" },
            { id: "d", label: "Cafe", color: "#e9c46a" },
            { id: "e", label: "Park", color: "#457b9d" },
          ]}
          getItemId={(item) => item.id}
          onReorder={() => {}}
          renderItem={(item, { dragHandle }) => (
            <PhotoGridThumb
              dragHandle={dragHandle}
              isCover={coverId === item.id}
              coverButton={
                <PhotoGridCoverButton
                  active={coverId === item.id}
                  disabled={coverId === item.id}
                  onClick={() => setCoverId(item.id)}
                />
              }
              removeButton={
                <PhotoGridRemoveButton onClick={() => setCoverId(null)} />
              }
            >
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
            </PhotoGridThumb>
          )}
        />
      </StoryFrame>
    );
  },
};
