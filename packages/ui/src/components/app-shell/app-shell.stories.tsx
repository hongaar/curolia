import type { Meta, StoryObj } from "@storybook/react";
import { Map, Menu, Settings } from "lucide-react";
import { useState } from "react";
import { withMemoryRouter } from "../../storybook/decorators";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyFrameStyles } from "../../storybook/story-frame";
import { Button } from "../button";
import { DropdownMenu } from "../dropdown-menu";
import {
  AccountMenuContent,
  AccountMenuTrigger,
  FloatingNavBar,
} from "../floating-nav-bar";
import { Input } from "../input";
import {
  MainToolbarBrand,
  MainToolbarMenuButton,
  MainToolbarMenuIcon,
  MainToolbarSearchSlot,
  MainToolbarShell,
} from "../main-toolbar-panel";
import {
  MapControlsLayer,
  MapControlsTopRight,
  MapHost,
  MapLayer,
  MapPageRoot,
  MapVignette,
} from "../map";
import { MapToolbar, MapToolbarButton } from "../map-toolbar";
import {
  NavigationSidebarLabel,
  NavigationSidebarNavLink,
  NavigationSidebarRoot,
  NavigationSidebarSection,
} from "../navigation-sidebar";
import { UserAvatar } from "../user-avatar";
import { AppShellLayout } from "./app-shell";

const appShellMeta = componentStoryMeta(
  "Authenticated layout: sidebar slot, main outlet, toolbar header.",
  "Pass `sidebar`, `children` (usually map or page), and optional `header` (floating nav). Control `sidebarOpen` and `overlayMain` from app state.",
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

function SidebarDemo() {
  return (
    <NavigationSidebarRoot>
      <NavigationSidebarSection>
        <NavigationSidebarLabel>Map</NavigationSidebarLabel>
        <p style={{ margin: 0, fontSize: "0.875rem", padding: "0 0.5rem" }}>
          Summer 2025
        </p>
      </NavigationSidebarSection>
      <NavigationSidebarSection gap="lg">
        <NavigationSidebarLabel spaced>Navigate</NavigationSidebarLabel>
        <NavigationSidebarNavLink to="/map" end icon={<Map aria-hidden />}>
          Map
        </NavigationSidebarNavLink>
        <NavigationSidebarNavLink
          to="/settings"
          icon={<Settings aria-hidden />}
        >
          Settings
        </NavigationSidebarNavLink>
      </NavigationSidebarSection>
    </NavigationSidebarRoot>
  );
}

function ShellDemo({
  sidebarOpen: initialOpen = true,
  overlayMain = false,
}: {
  sidebarOpen?: boolean;
  overlayMain?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(initialOpen);
  return (
    <AppShellLayout
      sidebarOpen={sidebarOpen}
      overlayMain={overlayMain}
      sidebar={<SidebarDemo />}
      header={
        <FloatingNavBar
          toolbar={
            <MainToolbarShell>
              <MainToolbarMenuButton
                aria-label="Toggle navigation"
                onClick={() => setSidebarOpen((o) => !o)}
              >
                <MainToolbarMenuIcon>
                  <Menu aria-hidden />
                </MainToolbarMenuIcon>
              </MainToolbarMenuButton>
              <MainToolbarBrand>Curolia</MainToolbarBrand>
              <MainToolbarSearchSlot>
                <Input placeholder="Search pins…" aria-label="Search" />
              </MainToolbarSearchSlot>
            </MainToolbarShell>
          }
          accountMenu={
            <DropdownMenu>
              <AccountMenuTrigger title="Account" aria-label="Account menu">
                <UserAvatar
                  email="demo@curolia.app"
                  storedAvatarUrl={null}
                  label="Demo user"
                  size="sm"
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
  parameters: storyDocs("Desktop layout with sidebar open beside the map."),
  render: () => <ShellDemo sidebarOpen />,
};

export const SidebarClosed: Story = {
  parameters: storyDocs("Sidebar collapsed; map uses full width."),
  render: () => <ShellDemo sidebarOpen={false} />,
};

export const OverlaySidebar: Story = {
  parameters: storyDocs("Sidebar overlays the map (mobile-style)."),
  render: () => <ShellDemo sidebarOpen overlayMain />,
};
