import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Layers, MapPin, Plus } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyFrameStyles } from "../../storybook/story-frame";
import { Badge } from "../badge";
import { Button } from "../button";
import { FloatingPanel } from "../floating-panel";
import {
  MapControlsBottomRight,
  MapControlsLayer,
  MapControlsTopRight,
  MapHost,
  MapLayer,
  MapPageRoot,
  MapPlacementHint,
  MapSidebarDismiss,
  MapToolbarGroup,
  MapToolbarIconButton,
  MapVignette,
  TraceMapContainer,
  TraceMapFloatingHost,
  TraceMapFloatingPanel,
  TraceMapSidebarActions,
  TraceMapSidebarBody,
  TraceMapSidebarDescription,
  TraceMapSidebarHeader,
  TraceMapSidebarHeaderActions,
  TraceMapSidebarPhotoSkeleton,
  TraceMapSidebarPhotoStrip,
  TraceMapSidebarStatus,
  TraceMapSidebarTagRow,
} from "./map";

const meta = {
  title: "Components/Map",
  ...componentStoryMeta(
    `Map page layers, controls, trace sidebar, markers, and mobile sheet.`,
    `Structure: \`MapPageRoot\` → \`MapLayer\` / \`MapControlsLayer\`. Use trace sidebar primitives for the selected trace panel.`,
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
    "Full map page with toolbar, FAB, and trace sidebar panel.",
  ),
  render: () => {
    const [layersOpen, setLayersOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    return (
      <div style={{ height: "100svh", width: "100%" }}>
        <MapPageRoot>
          <MapLayer>
            <MapHost>
              <MockMapSurface />
            </MapHost>
            <MapVignette />
          </MapLayer>
          <MapSidebarDismiss
            open={sidebarOpen}
            onDismiss={() => setSidebarOpen(false)}
          />
          <MapControlsLayer>
            <MapControlsTopRight>
              <MapToolbarGroup>
                <MapToolbarIconButton
                  icon={
                    <Layers className={storyFrameStyles.iconSm} aria-hidden />
                  }
                  label="Layers"
                  active={layersOpen}
                  onClick={() => setLayersOpen((v) => !v)}
                />
                <MapToolbarIconButton
                  icon={
                    <MapPin className={storyFrameStyles.iconSm} aria-hidden />
                  }
                  label="Fit bounds"
                  onClick={() => undefined}
                />
              </MapToolbarGroup>
            </MapControlsTopRight>
            <MapControlsBottomRight>
              <Button size="icon" aria-label="Add trace">
                <Plus aria-hidden />
              </Button>
            </MapControlsBottomRight>
          </MapControlsLayer>
          {sidebarOpen ? (
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
              <TraceMapSidebarBody>
                <TraceMapSidebarHeader
                  title="Café de Flore"
                  actions={
                    <TraceMapSidebarHeaderActions>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </TraceMapSidebarHeaderActions>
                  }
                />
                <TraceMapSidebarDescription>
                  Morning coffee before exploring Saint-Germain.
                </TraceMapSidebarDescription>
                <TraceMapSidebarTagRow>
                  <Badge variant="secondary">Food</Badge>
                  <Badge variant="outline">Paris</Badge>
                </TraceMapSidebarTagRow>
                <TraceMapSidebarPhotoStrip>
                  <TraceMapSidebarPhotoSkeleton />
                  <TraceMapSidebarPhotoSkeleton />
                  <TraceMapSidebarPhotoSkeleton />
                </TraceMapSidebarPhotoStrip>
                <TraceMapSidebarStatus>
                  3 photos · 2 links
                </TraceMapSidebarStatus>
                <TraceMapSidebarActions>
                  <Button size="sm">Open trace</Button>
                </TraceMapSidebarActions>
              </TraceMapSidebarBody>
            </FloatingPanel>
          ) : null}
        </MapPageRoot>
      </div>
    );
  },
};

export const PlacementMode: Story = {
  parameters: storyDocs("Trace placement mode with inset border and hint."),
  render: () => (
    <div style={{ height: "24rem", width: "100%", position: "relative" }}>
      <MapPageRoot>
        <MapLayer>
          <TraceMapContainer placementMode />
          <MapPlacementHint>Click the map to place this trace</MapPlacementHint>
        </MapLayer>
      </MapPageRoot>
    </div>
  ),
};

export const FloatingTraceCard: Story = {
  parameters: storyDocs("Anchored floating card for a map marker."),
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
      <TraceMapFloatingHost ready>
        <TraceMapFloatingPanel anchored>
          <p style={{ margin: 0, fontWeight: 500 }}>Louvre Museum</p>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.75rem",
              color: "var(--muted-foreground)",
            }}
          >
            Tap to open trace
          </p>
        </TraceMapFloatingPanel>
      </TraceMapFloatingHost>
    </div>
  ),
};
