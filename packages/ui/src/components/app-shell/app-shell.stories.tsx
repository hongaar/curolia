import type { Meta, StoryObj } from "@storybook/react";
import { Map } from "lucide-react";
import { useState } from "react";
import { withMemoryRouter } from "../../storybook/decorators";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyFrameStyles } from "../../storybook/story-frame";
import { Button } from "../button";
import { DropdownMenu } from "../dropdown-menu";
import { AccountMenuContent, AccountMenuTrigger } from "../floating-nav-bar";
import { Input } from "../input";
import { MainToolbar } from "../main-toolbar";
import {
  MapControlsLayer,
  MapControlsTopRight,
  MapHost,
  MapLayer,
  MapPageRoot,
  MapVignette,
} from "../map";
import { MapPickerContent, MapPickerTrigger } from "../map-picker";
import { MapToolbar, MapToolbarButton } from "../map-toolbar";
import { UserAvatar } from "../user-avatar";
import { AppShellLayout } from "./app-shell";

const appShellMeta = componentStoryMeta(
  "Authenticated layout: main outlet and floating toolbar header.",
  "Pass `children` (usually map or page) and optional `header` (floating nav).",
);

const meta = {
  title: "App Shell",
  ...appShellMeta,
  component: AppShellLayout,
  decorators: [withMemoryRouter],
  parameters: {
    ...appShellMeta.parameters,
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function MapChromeDemo() {
  const [layersOpen, setLayersOpen] = useState(false);
  return (
    <MapPageRoot>
      <MapLayer>
        <MapHost>
          <div className={storyFrameStyles.mapPlaceholder} aria-hidden />
        </MapHost>
        <MapVignette />
      </MapLayer>
      <MapControlsLayer>
        <MapControlsTopRight>
          <MapToolbar>
            <MapToolbarButton
              icon={<Map className={storyFrameStyles.iconSm} aria-hidden />}
              label="Layers"
              active={layersOpen}
              onClick={() => setLayersOpen((v) => !v)}
            />
          </MapToolbar>
        </MapControlsTopRight>
      </MapControlsLayer>
    </MapPageRoot>
  );
}

function ShellDemo() {
  return (
    <AppShellLayout
      header={
        <MainToolbar
          logoSrc="/favicon.png"
          mapPicker={
            <DropdownMenu>
              <MapPickerTrigger
                mapEmoji="🗺️"
                mapName="Summer 2025"
                aria-label="Select map"
              />
              <MapPickerContent>
                <Button variant="ghost" size="sm">
                  Switch map…
                </Button>
              </MapPickerContent>
            </DropdownMenu>
          }
          search={<Input placeholder="Search pins…" aria-label="Search" />}
          accountMenu={
            <DropdownMenu>
              <AccountMenuTrigger title="Account" aria-label="Account menu">
                <UserAvatar
                  email="demo@curolia.app"
                  storedAvatarUrl={null}
                  label="Demo user"
                  size="full"
                />
              </AccountMenuTrigger>
              <AccountMenuContent>
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </AccountMenuContent>
            </DropdownMenu>
          }
        />
      }
    >
      <MapChromeDemo />
    </AppShellLayout>
  );
}

export const Default: Story = {
  parameters: storyDocs(
    "Map page with floating toolbar over full-width content.",
  ),
  render: () => <ShellDemo />,
};
