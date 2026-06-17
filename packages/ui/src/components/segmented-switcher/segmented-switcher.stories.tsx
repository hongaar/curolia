import type { Meta, StoryObj } from "@storybook/react";
import { BookOpen, LayoutGrid, Map as MapIcon, Settings } from "lucide-react";
import { MemoryRouter } from "react-router-dom";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { SegmentedSwitcher, SegmentedSwitcherLink } from "./segmented-switcher";

type SwitcherArgs = {
  "aria-label": string;
  size?: "default" | "lg";
};

const meta = {
  title: "Segmented Switcher",
  ...componentStoryMeta(
    "Pill-shaped segmented navigation for two or more routes.",
    "Compose with `SegmentedSwitcherLink` children. Active segment follows the current route.",
  ),
  args: {
    "aria-label": "Map view",
    size: "default",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["default", "lg"],
    },
  },
} satisfies Meta<SwitcherArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

function SwitcherLinks({ withIcons = true }: { withIcons?: boolean }) {
  return (
    <>
      <SegmentedSwitcherLink
        to="/map/demo"
        end
        icon={withIcons ? <MapIcon /> : undefined}
      >
        Map
      </SegmentedSwitcherLink>
      <SegmentedSwitcherLink
        to="/blog/demo"
        end
        icon={withIcons ? <BookOpen /> : undefined}
      >
        Blog
      </SegmentedSwitcherLink>
    </>
  );
}

export const MapBlog: Story = {
  parameters: storyDocs("Default-size Map / Blog switcher with icons."),
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/map/demo"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: () => (
    <SegmentedSwitcher aria-label="Map view">
      <SwitcherLinks />
    </SegmentedSwitcher>
  ),
};

export const BlogActive: Story = {
  parameters: storyDocs("Blog segment active when route matches."),
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/blog/demo"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: () => (
    <SegmentedSwitcher aria-label="Map view">
      <SwitcherLinks />
    </SegmentedSwitcher>
  ),
};

export const TextOnly: Story = {
  parameters: storyDocs("`SegmentedSwitcherLink` without `icon`."),
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/map/demo"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: () => (
    <SegmentedSwitcher aria-label="Map view">
      <SwitcherLinks withIcons={false} />
    </SegmentedSwitcher>
  ),
};

export const Large: Story = {
  parameters: storyDocs(
    '`size="lg"` for floating map controls — taller track, larger icons and labels.',
  ),
  args: {
    "aria-label": "Map view",
    size: "lg",
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/map/demo"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: () => (
    <SegmentedSwitcher aria-label="Map view" size="lg">
      <SwitcherLinks />
    </SegmentedSwitcher>
  ),
};

export const ContainerLabels: Story = {
  parameters: storyDocs(
    '`labelMode="container"` — labels appear only when the host container is at least 36rem wide; slight overflow is allowed.',
  ),
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/map/demo"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: () => (
    <div
      style={{
        resize: "horizontal",
        overflow: "auto",
        width: "18rem",
        minWidth: "12rem",
        maxWidth: "100%",
        padding: "1rem",
        border: "1px dashed var(--border)",
        containerType: "inline-size",
        containerName: "map-controls-bottom-center",
      }}
    >
      <SegmentedSwitcher aria-label="Map view" size="lg" labelMode="container">
        <SwitcherLinks />
        <SegmentedSwitcherLink to="/gallery/demo" end icon={<LayoutGrid />}>
          Gallery
        </SegmentedSwitcherLink>
      </SegmentedSwitcher>
    </div>
  ),
};

export const ThreeSegments: Story = {
  parameters: storyDocs("Three or more links in one switcher."),
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/map/demo"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  render: () => (
    <SegmentedSwitcher aria-label="App sections">
      <SwitcherLinks />
      <SegmentedSwitcherLink to="/settings" end icon={<Settings />}>
        Settings
      </SegmentedSwitcherLink>
    </SegmentedSwitcher>
  ),
};
