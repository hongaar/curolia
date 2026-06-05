import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { Text } from "../text";
import {
  MapFloatingAnchor,
  MapFloatingPanel,
  MapQuickAddAnchor,
} from "./map-floating";

const meta = {
  title: "Map Floating",
  ...componentStoryMeta(
    `Fixed-position hosts for map popovers and quick-add UI.`,
    `Pair \`MapFloatingAnchor\` with Floating UI on desktop. Use \`MapFloatingPanel\` for popover chrome and \`MapQuickAddAnchor\` for the add-pin affordance.`,
  ),
  component: MapFloatingAnchor,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const AnchorReady: Story = {
  parameters: storyDocs(
    "`ready={true}` shows the anchored popover host at its computed position.",
  ),
  render: () => (
    <StoryFrame width="md">
      <div style={{ position: "relative", height: "12rem" }}>
        <MapFloatingAnchor ready>
          <MapFloatingPanel>
            <Text variant="body">Popover beside marker</Text>
          </MapFloatingPanel>
        </MapFloatingAnchor>
      </div>
    </StoryFrame>
  ),
};

export const AnchorHidden: Story = {
  parameters: storyDocs(
    "`ready={false}` hides the anchor until Floating UI has a position.",
  ),
  render: () => (
    <StoryFrame width="md">
      <div style={{ position: "relative", height: "12rem" }}>
        <MapFloatingAnchor ready={false}>
          <MapFloatingPanel>
            <Text variant="body">Hidden until positioned</Text>
          </MapFloatingPanel>
        </MapFloatingAnchor>
        <Text variant="muted">Anchor is invisible while `ready` is false.</Text>
      </div>
    </StoryFrame>
  ),
};

export const PanelAnchored: StoryObj<typeof MapFloatingPanel> = {
  parameters: storyDocs("Default anchored panel chrome."),
  render: () => (
    <StoryFrame width="sm">
      <MapFloatingPanel anchored>
        <Text variant="body">Anchored popover panel</Text>
      </MapFloatingPanel>
    </StoryFrame>
  ),
};

export const PanelFallback: StoryObj<typeof MapFloatingPanel> = {
  parameters: storyDocs(
    "`anchored={false}` and `fallback` for mobile sheet-style layout.",
  ),
  render: () => (
    <StoryFrame width="sm">
      <MapFloatingPanel anchored={false} fallback>
        <Text variant="body">Fallback panel (not anchored)</Text>
      </MapFloatingPanel>
    </StoryFrame>
  ),
};

export const QuickAddAnchor: StoryObj<typeof MapQuickAddAnchor> = {
  parameters: storyDocs("Quick-add pin affordance host on the map."),
  render: () => (
    <StoryFrame width="md">
      <div style={{ position: "relative", height: "8rem" }}>
        <MapQuickAddAnchor>
          <Button size="sm">Add pin here</Button>
        </MapQuickAddAnchor>
      </div>
    </StoryFrame>
  ),
};
