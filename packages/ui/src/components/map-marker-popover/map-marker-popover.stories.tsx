import type { Meta, StoryObj } from "@storybook/react";
import { Pencil, X } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Badge } from "../badge";
import { Button } from "../button";
import { FloatingPanel } from "../floating-panel";
import { PinMetadataSubtitleContent } from "../pin-metadata-subtitle";
import { Sheet } from "../sheet";
import {
  MapMarkerPopoverActions,
  MapMarkerPopoverBody,
  MapMarkerPopoverDescription,
  MapMarkerPopoverHeader,
  MapMarkerPopoverHeaderActions,
  MapMarkerPopoverPhotoSkeleton,
  MapMarkerPopoverPhotoStrip,
  MapMarkerPopoverSheetBody,
  MapMarkerPopoverSheetContent,
  MapMarkerPopoverSheetTitle,
  MapMarkerPopoverStatus,
  MapMarkerPopoverStatusStack,
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

function PopoverBody({
  withActions = false,
  withStatusStack = false,
  withMetadataSubtitle = false,
  withPhotos = true,
  withTags = true,
}: {
  withActions?: boolean;
  withStatusStack?: boolean;
  withMetadataSubtitle?: boolean;
  withPhotos?: boolean;
  withTags?: boolean;
}) {
  return (
    <MapMarkerPopoverBody>
      <MapMarkerPopoverHeader
        title="Café de Flore"
        actions={
          withActions ? (
            <MapMarkerPopoverHeaderActions>
              <Button size="icon-sm" variant="ghost" aria-label="Edit pin">
                <Pencil size={14} />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Close">
                <X size={14} />
              </Button>
            </MapMarkerPopoverHeaderActions>
          ) : undefined
        }
      />
      {withMetadataSubtitle ? (
        <MapMarkerPopoverStatus>
          <PinMetadataSubtitleContent
            subtitle={{
              parts: [
                { kind: "text", text: "Paris" },
                { kind: "dogs_welcome" },
              ],
            }}
          />
        </MapMarkerPopoverStatus>
      ) : withStatusStack ? (
        <MapMarkerPopoverStatusStack
          rows={["Paris, France", "12 Jun 2025", "⛅ 18°C"]}
        />
      ) : (
        <MapMarkerPopoverStatus>3 photos · 2 links</MapMarkerPopoverStatus>
      )}
      <MapMarkerPopoverDescription markdown="Morning coffee before exploring *Saint-Germain*." />
      {withTags ? (
        <MapMarkerPopoverTagRow>
          <Badge variant="secondary">Food</Badge>
        </MapMarkerPopoverTagRow>
      ) : null}
      {withPhotos ? (
        <MapMarkerPopoverPhotoStrip>
          <MapMarkerPopoverPhotoSkeleton />
          <MapMarkerPopoverPhotoSkeleton />
        </MapMarkerPopoverPhotoStrip>
      ) : null}
      <MapMarkerPopoverActions>
        <Button size="sm">Open pin</Button>
      </MapMarkerPopoverActions>
    </MapMarkerPopoverBody>
  );
}

export const Default: Story = {
  parameters: storyDocs("Popover body beside a selected marker."),
  render: () => (
    <FloatingPanel style={{ maxWidth: "22rem" }}>
      <PopoverBody />
    </FloatingPanel>
  ),
};

export const WithHeaderActions: Story = {
  parameters: storyDocs("`MapMarkerPopoverHeader` `actions` slot."),
  render: () => (
    <FloatingPanel style={{ maxWidth: "22rem" }}>
      <PopoverBody withActions />
    </FloatingPanel>
  ),
};

export const StatusStack: Story = {
  parameters: storyDocs("`MapMarkerPopoverStatusStack` with multiple rows."),
  render: () => (
    <FloatingPanel style={{ maxWidth: "22rem" }}>
      <PopoverBody withStatusStack />
    </FloatingPanel>
  ),
};

export const MetadataSubtitle: Story = {
  parameters: storyDocs(
    "Enrichment subtitle via `PinMetadataSubtitleContent`.",
  ),
  render: () => (
    <FloatingPanel style={{ maxWidth: "22rem" }}>
      <PopoverBody withMetadataSubtitle />
    </FloatingPanel>
  ),
};

export const NoTagsNoPhotos: Story = {
  parameters: storyDocs("Minimal body with description and actions only."),
  render: () => (
    <FloatingPanel style={{ maxWidth: "22rem" }}>
      <PopoverBody withPhotos={false} withTags={false} />
    </FloatingPanel>
  ),
};

export const MinimalTitleOnly: Story = {
  parameters: storyDocs("Header title without optional sections."),
  render: () => (
    <FloatingPanel style={{ maxWidth: "22rem" }}>
      <MapMarkerPopoverBody>
        <MapMarkerPopoverHeader title="Café de Flore" />
        <MapMarkerPopoverActions>
          <Button size="sm">Open pin</Button>
        </MapMarkerPopoverActions>
      </MapMarkerPopoverBody>
    </FloatingPanel>
  ),
};

export const MobileSheet: Story = {
  parameters: storyDocs(
    "Bottom sheet wrapper for small viewports (`MapMarkerPopoverSheetContent`).",
  ),
  render: () => (
    <Sheet defaultOpen>
      <MapMarkerPopoverSheetContent>
        <MapMarkerPopoverSheetTitle>Café de Flore</MapMarkerPopoverSheetTitle>
        <MapMarkerPopoverSheetBody>
          <PopoverBody withStatusStack />
        </MapMarkerPopoverSheetBody>
      </MapMarkerPopoverSheetContent>
    </Sheet>
  ),
};
