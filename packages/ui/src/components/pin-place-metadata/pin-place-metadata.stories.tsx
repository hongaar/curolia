import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import {
  PinPlaceMetadataAttribution,
  PinPlaceMetadataLink,
  PinPlaceMetadataLoading,
  PinPlaceMetadataMultiline,
  PinPlaceMetadataRoot,
  PinPlaceMetadataRow,
  PinPlaceMetadataSource,
  PinPlaceMetadataStatus,
  PinPlaceMetadataText,
  type PinPlaceMetadataFieldKey,
} from "./pin-place-metadata";

const meta = {
  title: "Pin Place Metadata",
  ...componentStoryMeta(
    `Definition list for enriched place facts on pin detail.`,
    `Compose \`PinPlaceMetadataRoot\` with \`PinPlaceMetadataRow\` per \`fieldKey\`. Use value primitives for text, links, multiline hours, and status chips.`,
  ),
  component: PinPlaceMetadataRoot,
} satisfies Meta;

export default meta;
type Story = StoryObj;

const ALL_FIELD_KEYS: PinPlaceMetadataFieldKey[] = [
  "place_name",
  "place_type",
  "cuisine",
  "dietary_options",
  "wheelchair_access",
  "dog_policy",
  "brand",
  "operator",
  "phone",
  "website",
  "opening_hours",
  "email",
];

export const Loading: StoryObj<typeof PinPlaceMetadataLoading> = {
  parameters: storyDocs("Loading placeholder while place facts fetch."),
  render: () => (
    <StoryFrame width="md">
      <PinPlaceMetadataLoading>Loading place details…</PinPlaceMetadataLoading>
    </StoryFrame>
  ),
};

export const FullPanel: Story = {
  parameters: storyDocs("Typical restaurant panel with mixed value types."),
  render: () => (
    <StoryFrame width="md">
      <PinPlaceMetadataRoot>
        <PinPlaceMetadataRow fieldKey="place_name">
          <PinPlaceMetadataText>Café de Flore</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="place_type">
          <PinPlaceMetadataText>Café</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="cuisine">
          <PinPlaceMetadataText>French</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="opening_hours">
          <PinPlaceMetadataMultiline>
            Mon–Fri 08:00–20:00{"\n"}Sat–Sun 09:00–22:00
          </PinPlaceMetadataMultiline>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="website">
          <PinPlaceMetadataLink href="https://cafedeflore.fr">
            cafedeflore.fr
          </PinPlaceMetadataLink>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="phone">
          <PinPlaceMetadataText>+33 1 45 48 55 26</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="wheelchair_access">
          <PinPlaceMetadataStatus>Wheelchair friendly ✓</PinPlaceMetadataStatus>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="dog_policy">
          <PinPlaceMetadataStatus>Dogs welcome ✓</PinPlaceMetadataStatus>
        </PinPlaceMetadataRow>
      </PinPlaceMetadataRoot>
    </StoryFrame>
  ),
};

export const WithFooter: Story = {
  parameters: storyDocs(
    "`footer` slot for source label and attribution tooltip.",
  ),
  render: () => (
    <StoryFrame width="md">
      <PinPlaceMetadataRoot
        footer={
          <>
            <PinPlaceMetadataSource>OpenStreetMap</PinPlaceMetadataSource>
            <PinPlaceMetadataAttribution sources={["OpenStreetMap"]} />
          </>
        }
      >
        <PinPlaceMetadataRow fieldKey="place_name">
          <PinPlaceMetadataText>Café de Flore</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
      </PinPlaceMetadataRoot>
    </StoryFrame>
  ),
};

export const AttributionMultipleSources: StoryObj<
  typeof PinPlaceMetadataAttribution
> = {
  parameters: storyDocs("Multiple `sources` join in the attribution tooltip."),
  render: () => (
    <StoryFrame width="sm">
      <PinPlaceMetadataAttribution sources={["OpenStreetMap", "Nominatim"]} />
    </StoryFrame>
  ),
};

export const DietaryAndBrand: Story = {
  parameters: storyDocs("Brand, operator, dietary, and email rows."),
  render: () => (
    <StoryFrame width="md">
      <PinPlaceMetadataRoot>
        <PinPlaceMetadataRow fieldKey="dietary_options">
          <PinPlaceMetadataText>Vegetarian, vegan</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="brand">
          <PinPlaceMetadataText>Starbucks</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="operator">
          <PinPlaceMetadataText>Starbucks EMEA</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="email">
          <PinPlaceMetadataText>hello@example.com</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
      </PinPlaceMetadataRoot>
    </StoryFrame>
  ),
};

export const LinkRow: StoryObj<typeof PinPlaceMetadataLink> = {
  parameters: storyDocs("External link opens in a new tab."),
  render: () => (
    <StoryFrame width="md">
      <PinPlaceMetadataRoot>
        <PinPlaceMetadataRow fieldKey="website">
          <PinPlaceMetadataLink href="https://example.com">
            example.com
          </PinPlaceMetadataLink>
        </PinPlaceMetadataRow>
      </PinPlaceMetadataRoot>
    </StoryFrame>
  ),
};

export const MultilineHours: StoryObj<typeof PinPlaceMetadataMultiline> = {
  parameters: storyDocs("Multiline value preserves line breaks."),
  render: () => (
    <StoryFrame width="md">
      <PinPlaceMetadataRoot>
        <PinPlaceMetadataRow fieldKey="opening_hours">
          <PinPlaceMetadataMultiline>
            Mon 09:00–17:00{"\n"}Tue closed{"\n"}Wed–Fri 09:00–17:00
          </PinPlaceMetadataMultiline>
        </PinPlaceMetadataRow>
      </PinPlaceMetadataRoot>
    </StoryFrame>
  ),
};

export const MinimalNameOnly: Story = {
  parameters: storyDocs("Single row when only the place name is known."),
  render: () => (
    <StoryFrame width="md">
      <PinPlaceMetadataRoot>
        <PinPlaceMetadataRow fieldKey="place_name">
          <PinPlaceMetadataText>Unnamed place</PinPlaceMetadataText>
        </PinPlaceMetadataRow>
      </PinPlaceMetadataRoot>
    </StoryFrame>
  ),
};

export const AllFieldIcons: Story = {
  parameters: storyDocs("Each `fieldKey` label and icon (reference grid)."),
  render: () => (
    <StoryFrame width="md">
      <PinPlaceMetadataRoot>
        {ALL_FIELD_KEYS.map((fieldKey) => (
          <PinPlaceMetadataRow key={fieldKey} fieldKey={fieldKey}>
            <PinPlaceMetadataText>Sample value</PinPlaceMetadataText>
          </PinPlaceMetadataRow>
        ))}
      </PinPlaceMetadataRoot>
    </StoryFrame>
  ),
};

export const StatusVariants: StoryObj<typeof PinPlaceMetadataStatus> = {
  parameters: storyDocs("Status chip styling for yes/no enrichment."),
  render: () => (
    <StoryFrame width="md">
      <PinPlaceMetadataRoot>
        <PinPlaceMetadataRow fieldKey="wheelchair_access">
          <PinPlaceMetadataStatus>Wheelchair friendly ✓</PinPlaceMetadataStatus>
        </PinPlaceMetadataRow>
        <PinPlaceMetadataRow fieldKey="dog_policy">
          <PinPlaceMetadataStatus>Dogs unwelcome ✗</PinPlaceMetadataStatus>
        </PinPlaceMetadataRow>
      </PinPlaceMetadataRoot>
    </StoryFrame>
  ),
};
