import type { Meta, StoryObj } from "@storybook/react";
import { Layers, MapPin, Settings, Tag } from "lucide-react";
import { useState } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyFrameStyles } from "../../storybook/story-frame";
import { DropdownMenu, DropdownMenuContent } from "../dropdown-menu";
import {
  MapToolbar,
  MapToolbarButton,
  MapToolbarIconButton,
} from "./map-toolbar";

const meta = {
  title: "Map Toolbar",
  ...componentStoryMeta(
    "Expand-on-hover map control strip (zoom, layers, fit bounds).",
    "Compose `MapToolbar` with `MapToolbarButton` or `MapToolbarIconButton` children inside `MapControlsBottomStack`.",
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

export const IconButtons: Story = {
  parameters: storyDocs(
    "Icon-only controls share one shell — action buttons and menu triggers.",
  ),
  render: () => {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.625rem",
        }}
      >
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <MapToolbar>
            <MapToolbarIconButton
              menuTrigger
              icon={<Tag className={storyFrameStyles.iconSm} aria-hidden />}
              label="Tag filters"
              active
              badgeCount={2}
            />
          </MapToolbar>
          <DropdownMenuContent align="end" side="top" sideOffset={8}>
            <div style={{ padding: "0.75rem 1rem" }}>Filter menu</div>
          </DropdownMenuContent>
        </DropdownMenu>
        <MapToolbar>
          <MapToolbarIconButton
            icon={<Settings className={storyFrameStyles.iconSm} aria-hidden />}
            label="Map settings"
            active={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
          />
        </MapToolbar>
      </div>
    );
  },
};
