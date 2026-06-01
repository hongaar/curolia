import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { AboutDialogShell } from "./about-dialog-shell";
import styles from "./about-dialog.module.css";
import { AboutLinkList } from "./about-link-list";
import { AboutMapAttributionSection } from "./about-map-attribution-section";
import { AboutVersionMeta } from "./about-version-meta";
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

const aboutLinks = [
  { id: "contact", label: "Contact" },
  { id: "terms", label: "Terms and Conditions" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "licenses", label: "Open source licenses" },
] as const;

const meta = {
  title: "About Dialog",
  ...componentStoryMeta(
    "About dialog shell, link list, and map attribution primitives.",
    "Compose the product About dialog in apps/web with site legal content.",
  ),
  decorators: [
    (Story) => (
      <StoryFrame width="md">
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const ShellMain: Story = {
  parameters: storyDocs(
    "Main about screen with version, link list, and map attribution.",
  ),
  render: function Render() {
    const [open, setOpen] = useState(true);
    const [panel, setPanel] = useState<string | null>(null);

    return (
      <AboutDialogShell
        open={open}
        onOpenChange={setOpen}
        title={panel ? "Panel" : "About Curolia"}
        onBack={panel ? () => setPanel(null) : undefined}
        main={
          <>
            <AboutVersionMeta version="0.0.0" />
            <AboutLinkList
              items={[...aboutLinks]}
              onSelect={(id) => setPanel(id)}
            />
            <AboutMapAttributionSection />
          </>
        }
        panel={
          panel ? (
            <p className={styles.npmEmpty}>Placeholder panel: {panel}</p>
          ) : undefined
        }
      />
    );
  },
};

export const LinkList: Story = {
  parameters: storyDocs("Chevron link rows for the about main menu."),
  render: function Render() {
    return <AboutLinkList items={[...aboutLinks]} onSelect={() => undefined} />;
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
