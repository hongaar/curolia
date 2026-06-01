import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MemoryRouter } from "react-router-dom";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { AboutDialog } from "./about-dialog";
import { MapAttributionInline } from "./map-attribution";
import type { NpmLicenseEntry } from "./npm-licenses-list";
import { NpmLicensesList } from "./npm-licenses-list";

const mockLicenses: NpmLicenseEntry[] = [
  {
    name: "react",
    version: "19.2.5",
    licenses: "MIT",
    repository: "https://github.com/facebook/react",
  },
  {
    name: "maplibre-gl",
    version: "5.5.0",
    licenses: "BSD-3-Clause",
    repository: "https://github.com/maplibre/maplibre-gl-js",
  },
];

const meta = {
  title: "About Dialog",
  ...componentStoryMeta(
    "About Curolia dialog with inline legal pages and map attribution.",
    "Use from the account menu in the web app; pass `npmLicensesContent` with generated entries from `apps/web`.",
  ),
  decorators: [
    (Story) => (
      <MemoryRouter>
        <StoryFrame width="md">
          <Story />
        </StoryFrame>
      </MemoryRouter>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs(
    "Main about screen with version, links, and map data attribution.",
  ),
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <AboutDialog
        open={open}
        onOpenChange={setOpen}
        version="0.0.0"
        npmLicensesContent={<NpmLicensesList entries={mockLicenses} />}
      />
    );
  },
};

export const MapAttribution: Story = {
  parameters: storyDocs("Inline OpenFreeMap / OpenStreetMap attribution copy."),
  render: () => <MapAttributionInline />,
};

export const NpmLicenses: Story = {
  parameters: storyDocs("Scrollable dependency licence list panel."),
  render: () => <NpmLicensesList entries={mockLicenses} />,
};
