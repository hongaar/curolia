import type { Meta, StoryObj } from "@storybook/react";
import { Map, Settings } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { withMemoryRouter } from "../../storybook/decorators";
import {
  NavigationSidebarLabel,
  NavigationSidebarNavLink,
  NavigationSidebarRoot,
  NavigationSidebarSection,
} from "./navigation-sidebar";

const meta = {
  title: "Navigation Sidebar",
  ...componentStoryMeta(
    `Journal picker, nav links, and tag filter chrome.`,
    `Requires \`react-router\` \`NavLink\` via \`NavigationSidebarNavLink\`. Build inside \`NavigationSidebarRoot\` sections.`,
  ),
  component: NavigationSidebarRoot,
  decorators: [withMemoryRouter],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Sidebar with journal section and nav links."),
  render: () => (
    <NavigationSidebarRoot>
      <NavigationSidebarSection>
        <NavigationSidebarLabel>Journal</NavigationSidebarLabel>
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
  ),
};
