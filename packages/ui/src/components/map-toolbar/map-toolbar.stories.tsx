import type { Meta, StoryObj } from "@storybook/react";
import { Layers, MapPin } from "lucide-react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyFrameStyles } from "../../storybook/story-frame";
import { MapToolbar, MapToolbarButton } from "./map-toolbar";

const meta = {
  title: "Map Toolbar",
  ...componentStoryMeta(
    "Expand-on-hover map control strip (zoom, layers, fit bounds).",
    "Compose `MapToolbar` with `MapToolbarButton` children inside `MapControlsTopRight`.",
  ),
} satisfies Meta<typeof MapToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Toolbar with layers toggle and fit-bounds action."),
  render: () => {
    const [layersOpen, setLayersOpen] = useState(false);
    return (
      <MapToolbar>
        <MapToolbarButton
          icon={<Layers className={storyFrameStyles.iconSm} aria-hidden />}
          label="Layers"
          active={layersOpen}
          onClick={() => setLayersOpen((v) => !v)}
        />
        <MapToolbarButton
          icon={<MapPin className={storyFrameStyles.iconSm} aria-hidden />}
          label="Fit bounds"
          onClick={() => undefined}
        />
      </MapToolbar>
    );
  },
};
