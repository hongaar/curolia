import type { Meta, StoryObj } from "@storybook/react";

import { componentStoryMeta } from "../../storybook/docs";
import { Button } from "../button/button";
import {
  PlaceDetailActions,
  PlaceDetailFactList,
  PlaceDetailHeader,
  PlaceDetailRoot,
  PlaceDetailSection,
} from "./place-detail";

const meta = {
  title: "Place detail",
  ...componentStoryMeta(
    "Read-only place / explore detail primitives.",
    "Compose headers, fact lists, and actions for explore place detail sheets.",
  ),
  component: PlaceDetailRoot,
} satisfies Meta<typeof PlaceDetailRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PlaceDetailRoot>
      <PlaceDetailHeader
        title="Café Central"
        subtitle="Café · Saved by 12 travelers"
        meta="Enriched from Wikidata"
      />
      <PlaceDetailSection title="About">
        <p>A popular café in the city center with outdoor seating.</p>
      </PlaceDetailSection>
      <PlaceDetailSection title="Details">
        <PlaceDetailFactList
          items={[
            { label: "Category", value: "Café" },
            { label: "Rating", value: "4.6" },
            { label: "Website", value: "example.com" },
          ]}
        />
      </PlaceDetailSection>
      <PlaceDetailActions>
        <Button>Save pin</Button>
      </PlaceDetailActions>
    </PlaceDetailRoot>
  ),
};
