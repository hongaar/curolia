import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import {
  PhotoGrid,
  PhotoGridCoverButton,
  PhotoGridPickerTile,
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

export const PickerTiles: Story = {
  parameters: storyDocs(
    "Selectable picker tiles — checkbox on hover, accent border by default, primary when selected.",
  ),
  render: function Render() {
    const [selected, setSelected] = useState(new Set(["b", "d"]));

    const items = [
      { id: "a", label: "Sunset", color: "#f4a261", distance: "42 m" },
      { id: "b", label: "Harbor", color: "#2a9d8f", distance: "120 m" },
      { id: "c", label: "Street", color: "#264653", distance: "0.8 km" },
      { id: "d", label: "Cafe", color: "#e9c46a", distance: "210 m" },
      { id: "e", label: "Park", color: "#457b9d", distance: "95 m" },
    ];

    function toggle(id: string) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }

    return (
      <StoryFrame width="md">
        <PhotoGrid>
          {items.map((item) => (
            <PhotoGridPickerTile
              key={item.id}
              src={`data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${item.color}"/></svg>`,
              )}`}
              alt={item.label}
              selected={selected.has(item.id)}
              onSelect={() => toggle(item.id)}
              footer={item.distance}
            />
          ))}
        </PhotoGrid>
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
