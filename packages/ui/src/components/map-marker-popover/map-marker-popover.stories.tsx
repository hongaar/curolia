import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Badge } from "../badge";
import { Button } from "../button";
import { FloatingPanel } from "../floating-panel";
import {
  MapMarkerPopoverActions,
  MapMarkerPopoverBody,
  MapMarkerPopoverDescription,
  MapMarkerPopoverHeader,
  MapMarkerPopoverPhotoSkeleton,
  MapMarkerPopoverPhotoStrip,
  MapMarkerPopoverStatus,
  MapMarkerPopoverTagRow,
} from "./map-marker-popover";

const meta = {
  title: "Map Marker Popover",
  ...componentStoryMeta(
    "Content primitives for the pin summary popover beside a map marker.",
    "Wrap in `FloatingPanel` + `MapFloatingAnchor` on desktop, or `MapMarkerPopoverSheetContent` on mobile.",
  ),
} satisfies Meta<typeof MapMarkerPopoverBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Popover body beside a selected marker."),
  render: () => (
    <FloatingPanel style={{ maxWidth: "22rem" }}>
      <MapMarkerPopoverBody>
        <MapMarkerPopoverHeader title="Café de Flore" />
        <MapMarkerPopoverDescription>
          Morning coffee before exploring Saint-Germain.
        </MapMarkerPopoverDescription>
        <MapMarkerPopoverTagRow>
          <Badge variant="secondary">Food</Badge>
        </MapMarkerPopoverTagRow>
        <MapMarkerPopoverPhotoStrip>
          <MapMarkerPopoverPhotoSkeleton />
          <MapMarkerPopoverPhotoSkeleton />
        </MapMarkerPopoverPhotoStrip>
        <MapMarkerPopoverStatus>3 photos · 2 links</MapMarkerPopoverStatus>
        <MapMarkerPopoverActions>
          <Button size="sm">Open pin</Button>
        </MapMarkerPopoverActions>
      </MapMarkerPopoverBody>
    </FloatingPanel>
  ),
};
