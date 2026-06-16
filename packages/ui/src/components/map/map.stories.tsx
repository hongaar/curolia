import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyFrameStyles } from "../../storybook/story-frame";
import { Badge } from "../badge";
import { Button } from "../button";
import { FloatingPanel } from "../floating-panel";
import { MapFloatingAnchor, MapFloatingPanel } from "../map-floating";
import {
  MapMarkerPopoverActions,
  MapMarkerPopoverBody,
  MapMarkerPopoverDescription,
  MapMarkerPopoverHeader,
  MapMarkerPopoverHeaderActions,
  MapMarkerPopoverPhotoSkeleton,
  MapMarkerPopoverPhotoStrip,
  MapMarkerPopoverStatus,
  MapMarkerPopoverTagRow,
} from "../map-marker-popover";
import { MapToolbar, MapToolbarButton } from "../map-toolbar";
import {
  MapBlogPinConnector,
  MapBlogPinConnectorMap,
  MapBlogSidePanel,
  MapBlogSidePanelContent,
  MapBlogSidePanelScrim,
  MapBlogSidePanelScroll,
  MapCanvas,
  MapControlsBottomRight,
  MapControlsLayer,
  MapControlsTopRight,
  MapHost,
  MapLayer,
  MapPageRoot,
  MapPlacementHint,
  MapVignette,
} from "./map";

const meta = {
  title: "Map",
  ...componentStoryMeta(
    `Map page shell: layers, controls, canvas, and marker popover layout.`,
    `Use \`@curolia/ui/map-toolbar\`, \`map-marker-popover\`, \`map-floating\`, and \`map-marker\` for composed pieces.`,
  ),
  component: MapPageRoot,
} satisfies Meta;

export default meta;
type Story = StoryObj;

function MockMapSurface() {
  return <div className={storyFrameStyles.mapPlaceholder} aria-hidden />;
}

export const Default: Story = {
  parameters: storyDocs(
    "Map page with toolbar, FAB, and marker popover beside the canvas.",
  ),
  render: () => {
    const [popoverOpen, setPopoverOpen] = useState(true);
    return (
      <div style={{ height: "100svh", width: "100%" }}>
        <MapPageRoot>
          <MapLayer>
            <MapHost>
              <MockMapSurface />
            </MapHost>
            <MapVignette />
          </MapLayer>
          <MapControlsLayer>
            <MapControlsTopRight>
              <MapToolbar>
                <MapToolbarButton
                  icon={
                    <span className={storyFrameStyles.iconSm} aria-hidden>
                      ⊞
                    </span>
                  }
                  label="Layers"
                  onClick={() => undefined}
                />
              </MapToolbar>
            </MapControlsTopRight>
            <MapControlsBottomRight>
              <Button size="icon" aria-label="Add pin">
                <Plus aria-hidden />
              </Button>
            </MapControlsBottomRight>
          </MapControlsLayer>
          {popoverOpen ? (
            <FloatingPanel
              elevated
              style={{
                position: "absolute",
                top: "5.5rem",
                left: "1rem",
                zIndex: 30,
                width: "min(22rem, calc(100% - 2rem))",
                maxHeight: "calc(100% - 7rem)",
                overflow: "auto",
              }}
            >
              <MapMarkerPopoverBody>
                <MapMarkerPopoverHeader
                  title="Café de Flore"
                  actions={
                    <MapMarkerPopoverHeaderActions>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </MapMarkerPopoverHeaderActions>
                  }
                />
                <MapMarkerPopoverDescription markdown="Morning coffee before exploring Saint-Germain." />
                <MapMarkerPopoverTagRow>
                  <Badge variant="secondary">Food</Badge>
                  <Badge variant="outline">Paris</Badge>
                </MapMarkerPopoverTagRow>
                <MapMarkerPopoverPhotoStrip>
                  <MapMarkerPopoverPhotoSkeleton />
                  <MapMarkerPopoverPhotoSkeleton />
                  <MapMarkerPopoverPhotoSkeleton />
                </MapMarkerPopoverPhotoStrip>
                <MapMarkerPopoverStatus>
                  3 photos · 2 links
                </MapMarkerPopoverStatus>
                <MapMarkerPopoverActions>
                  <Button size="sm">Open pin</Button>
                </MapMarkerPopoverActions>
              </MapMarkerPopoverBody>
            </FloatingPanel>
          ) : null}
        </MapPageRoot>
      </div>
    );
  },
};

export const PlacementMode: Story = {
  parameters: storyDocs("Pin placement mode with inset border and hint."),
  render: () => (
    <div style={{ height: "24rem", width: "100%", position: "relative" }}>
      <MapPageRoot>
        <MapLayer>
          <MapCanvas placementMode />
          <MapPlacementHint>Click the map to place this pin</MapPlacementHint>
        </MapLayer>
      </MapPageRoot>
    </div>
  ),
};

export const BlogSidePanel: Story = {
  parameters: storyDocs(
    "Desktop blog timeline in a wide right-hand panel (map stays visible on the left).",
  ),
  render: () => (
    <div style={{ height: "28rem", width: "100%", position: "relative" }}>
      <MapPageRoot>
        <MapLayer panelRightWidth="66.67%">
          <MapHost>
            <MockMapSurface />
          </MapHost>
          <MapVignette />
          <MapBlogSidePanel>
            <MapBlogSidePanelScroll>
              <MapBlogSidePanelContent>
                <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Summer 2025</h1>
                <p style={{ color: "var(--muted-foreground)" }}>
                  Blog entries scroll here while the map remains on the left.
                </p>
              </MapBlogSidePanelContent>
            </MapBlogSidePanelScroll>
          </MapBlogSidePanel>
        </MapLayer>
      </MapPageRoot>
    </div>
  ),
};

export const BlogSidePanelWithPinScrim: Story = {
  parameters: storyDocs(
    "Blog panel dimmed behind an open pin detail sheet; click the scrim to dismiss.",
  ),
  render: () => (
    <div style={{ height: "28rem", width: "100%", position: "relative" }}>
      <MapPageRoot>
        <MapLayer panelRightWidth="66.67%">
          <MapHost>
            <MockMapSurface />
          </MapHost>
          <MapBlogSidePanel>
            <MapBlogSidePanelScroll>
              <MapBlogSidePanelContent>
                <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Summer 2025</h1>
              </MapBlogSidePanelContent>
            </MapBlogSidePanelScroll>
            <MapBlogSidePanelScrim show onDismiss={() => undefined} />
          </MapBlogSidePanel>
        </MapLayer>
      </MapPageRoot>
    </div>
  ),
};

export const FloatingMarkerPopover: Story = {
  parameters: storyDocs(
    "Marker-anchored popover (desktop Floating UI placement).",
  ),
  render: () => (
    <div
      style={{
        position: "relative",
        height: "20rem",
        width: "100%",
        padding: "2rem",
      }}
    >
      <MockMapSurface />
      <MapFloatingAnchor ready>
        <MapFloatingPanel anchored>
          <FloatingPanel padding="default">
            <MapMarkerPopoverBody>
              <MapMarkerPopoverHeader title="Louvre Museum" />
              <MapMarkerPopoverStatus>Tap to open pin</MapMarkerPopoverStatus>
            </MapMarkerPopoverBody>
          </FloatingPanel>
        </MapFloatingPanel>
      </MapFloatingAnchor>
    </div>
  ),
};

export const BlogPinConnector: Story = {
  parameters: storyDocs(
    "Connector line: blog segment above the panel; map segment under markers.",
  ),
  render: () => (
    <div style={{ height: "20rem", width: "100%", position: "relative" }}>
      <MockMapSurface />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "40%",
          background: "var(--panel-bg-solid)",
          borderLeft: "1px solid var(--border)",
          zIndex: 15,
        }}
      />
      <MapBlogPinConnector x1={520} y1={140} x2={380} y2={118} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "60%",
          pointerEvents: "none",
        }}
      >
        <MapBlogPinConnectorMap x1={380} y1={118} x2={180} y2={96} />
      </div>
    </div>
  ),
};
