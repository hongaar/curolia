import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { MapFloatingPanel } from "../map-floating";
import {
  MapMarkerPopoverSheetContent,
  MapMarkerPopoverSheetTitle,
} from "../map-marker-popover";
import { Sheet } from "../sheet";
import {
  MapMarkerCollisionFloatingPanel,
  MapMarkerCollisionPanel,
  type MapMarkerCollisionItem,
} from "./map-marker-collision-panel";

const sampleItems: MapMarkerCollisionItem[] = [
  {
    id: "1",
    emoji: "🍽️",
    fill: "#16a34a",
    title: "Sirtaki",
    subtitle: "Stadhouderskade 81, Amsterdam",
  },
  {
    id: "2",
    emoji: "🍜",
    fill: "#16a34a",
    title: "Soep-er",
    subtitle: "Stadhouderskade 81, Amsterdam",
  },
  {
    id: "3",
    emoji: "🥗",
    fill: "#16a34a",
    title: "LOOF",
    subtitle: "Stadhouderskade 81, Amsterdam",
  },
  {
    id: "4",
    emoji: "🍰",
    fill: "#16a34a",
    title: "Toetje",
    subtitle: "2 July 2023 · Stadhouderskade 81, Amsterdam",
  },
];

const manyItems: MapMarkerCollisionItem[] = Array.from(
  { length: 15 },
  (_, index) => ({
    id: String(index + 1),
    emoji: "📍",
    fill: "#16a34a",
    title: `Pin ${index + 1}`,
    subtitle: "Stadhouderskade 81, Amsterdam",
  }),
);

const meta = {
  title: "Map Marker Collision Panel",
  component: MapMarkerCollisionPanel,
  ...componentStoryMeta(
    "Disambiguation list when several pins share the same map point.",
    "Wrap in `FloatingPanel` + `MapFloatingPanel` on desktop, or `MapMarkerPopoverSheetContent` on mobile.",
  ),
  args: {
    title: "4 pins here",
    items: sampleItems,
    onSelectItem: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof MapMarkerCollisionPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Floating panel beside a stacked map marker."),
  render: (args) => (
    <MapFloatingPanel anchored>
      <MapMarkerCollisionFloatingPanel {...args} />
    </MapFloatingPanel>
  ),
};

export const ManyPins: Story = {
  parameters: storyDocs("Scrollable list for larger collision groups."),
  args: {
    title: "15 pins here",
    items: manyItems,
  },
  render: (args) => (
    <MapFloatingPanel anchored>
      <MapMarkerCollisionFloatingPanel {...args} />
    </MapFloatingPanel>
  ),
};

export const MobileSheet: Story = {
  parameters: storyDocs(
    "Bottom sheet wrapper for small viewports (`sheet` layout).",
  ),
  args: {
    title: "4 pins here",
    items: sampleItems,
  },
  render: (args) => (
    <Sheet defaultOpen>
      <MapMarkerPopoverSheetContent>
        <MapMarkerPopoverSheetTitle>{args.title}</MapMarkerPopoverSheetTitle>
        <MapMarkerCollisionPanel {...args} sheet />
      </MapMarkerPopoverSheetContent>
    </Sheet>
  ),
};
