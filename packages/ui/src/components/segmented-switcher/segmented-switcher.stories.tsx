import type { Meta, StoryObj } from "@storybook/react";
import { BookOpen, Map as MapIcon } from "lucide-react";
import { MemoryRouter } from "react-router-dom";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { SegmentedSwitcher, SegmentedSwitcherLink } from "./segmented-switcher";

const meta = {
  title: "Segmented Switcher",
  ...componentStoryMeta(
    "Pill-shaped segmented navigation for two or more routes.",
    "Compose with `SegmentedSwitcherLink` children. Active segment follows the current route.",
  ),
  component: SegmentedSwitcher,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/map/demo"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof SegmentedSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MapBlog: Story = {
  parameters: storyDocs("Toolbar-style Map / Blog switcher."),
  render: () => (
    <SegmentedSwitcher aria-label="Map view">
      <SegmentedSwitcherLink to="/map/demo" end icon={<MapIcon />}>
        Map
      </SegmentedSwitcherLink>
      <SegmentedSwitcherLink to="/blog/demo" end icon={<BookOpen />}>
        Blog
      </SegmentedSwitcherLink>
    </SegmentedSwitcher>
  ),
};
