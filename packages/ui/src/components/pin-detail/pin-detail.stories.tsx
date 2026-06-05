import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { PinMetadataSubtitleContent } from "../pin-metadata-subtitle";
import {
  PinDetailActions,
  PinDetailCard,
  PinDetailContent,
  PinDetailDescription,
  PinDetailHeader,
  PinDetailHeaderMain,
  PinDetailInsetMap,
  PinDetailInsetMapCanvas,
  PinDetailInsetMapLink,
  PinDetailPhotoPlaceholder,
  PinDetailPhotoRow,
  PinDetailSubtitle,
  PinDetailSubtitleStack,
  PinDetailTagBadge,
  PinDetailTagRow,
  PinDetailTitle,
} from "./pin-detail";

const meta = {
  title: "Pin Detail",
  ...componentStoryMeta(
    `Pin detail page badges, metadata, and section layout.`,
    `Import tag badges and detail sections for the pin page sidebar and body.`,
  ),
  component: PinDetailCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Pin detail page card with tags and actions."),
  render: () => (
    <StoryFrame width="md">
      <PinDetailCard>
        <PinDetailHeader>
          <PinDetailHeaderMain>
            <PinDetailTitle>Café de Flore</PinDetailTitle>
            <PinDetailActions>
              <Button size="sm">Edit pin</Button>
            </PinDetailActions>
          </PinDetailHeaderMain>
          <PinDetailSubtitle>
            Paris · 12 Jun 2025 · ⛅ Cloudy · 18°C
          </PinDetailSubtitle>
        </PinDetailHeader>
        <PinDetailContent>
          <PinDetailDescription markdown="Morning coffee before exploring **Saint-Germain-des-Prés**." />
          <PinDetailTagRow>
            <PinDetailTagBadge style={{ background: "#3b82f6" }}>
              Food
            </PinDetailTagBadge>
            <PinDetailTagBadge>Paris</PinDetailTagBadge>
          </PinDetailTagRow>
        </PinDetailContent>
      </PinDetailCard>
    </StoryFrame>
  ),
};

export const SubtitleStack: Story = {
  parameters: storyDocs("`PinDetailSubtitleStack` for multiple subtitle rows."),
  render: () => (
    <StoryFrame width="md">
      <PinDetailCard>
        <PinDetailHeader>
          <PinDetailHeaderMain>
            <PinDetailTitle>Café de Flore</PinDetailTitle>
          </PinDetailHeaderMain>
          <PinDetailSubtitleStack
            rows={["Paris, France", "12 Jun 2025", "⛅ Cloudy · 18°C"]}
          />
        </PinDetailHeader>
      </PinDetailCard>
    </StoryFrame>
  ),
};

export const MetadataSubtitle: Story = {
  parameters: storyDocs(
    "Rich subtitle via `PinMetadataSubtitleContent` inside `PinDetailSubtitle`.",
  ),
  render: () => (
    <StoryFrame width="md">
      <PinDetailCard>
        <PinDetailHeader>
          <PinDetailHeaderMain>
            <PinDetailTitle>Dog-friendly café</PinDetailTitle>
          </PinDetailHeaderMain>
          <PinDetailSubtitle>
            <PinMetadataSubtitleContent
              subtitle={{
                parts: [
                  { kind: "text", text: "Paris" },
                  { kind: "wheelchair_friendly" },
                  { kind: "dogs_welcome" },
                ],
              }}
            />
          </PinDetailSubtitle>
        </PinDetailHeader>
      </PinDetailCard>
    </StoryFrame>
  ),
};

export const PhotoPlaceholders: Story = {
  parameters: storyDocs("`PinDetailPhotoRow` with placeholder tiles."),
  render: () => (
    <StoryFrame width="md">
      <PinDetailCard>
        <PinDetailContent>
          <PinDetailPhotoRow>
            <PinDetailPhotoPlaceholder>1</PinDetailPhotoPlaceholder>
            <PinDetailPhotoPlaceholder>2</PinDetailPhotoPlaceholder>
            <PinDetailPhotoPlaceholder>3</PinDetailPhotoPlaceholder>
          </PinDetailPhotoRow>
        </PinDetailContent>
      </PinDetailCard>
    </StoryFrame>
  ),
};

export const InsetMap: Story = {
  parameters: storyDocs("Inset map link and canvas slot for the pin mini-map."),
  render: () => (
    <StoryFrame width="md">
      <PinDetailCard>
        <PinDetailContent>
          <PinDetailInsetMapLink to="/map/demo" ariaLabel="Open on map">
            <PinDetailInsetMap>
              <PinDetailInsetMapCanvas />
            </PinDetailInsetMap>
          </PinDetailInsetMapLink>
        </PinDetailContent>
      </PinDetailCard>
    </StoryFrame>
  ),
};

export const PlainTags: Story = {
  parameters: storyDocs("`PinDetailTagBadge` without custom `style`."),
  render: () => (
    <StoryFrame width="md">
      <PinDetailCard>
        <PinDetailContent>
          <PinDetailTagRow>
            <PinDetailTagBadge>Food</PinDetailTagBadge>
            <PinDetailTagBadge>Paris</PinDetailTagBadge>
          </PinDetailTagRow>
        </PinDetailContent>
      </PinDetailCard>
    </StoryFrame>
  ),
};

export const MinimalHeader: Story = {
  parameters: storyDocs("Title-only header without subtitle or actions."),
  render: () => (
    <StoryFrame width="md">
      <PinDetailCard>
        <PinDetailHeader>
          <PinDetailHeaderMain>
            <PinDetailTitle>Unnamed pin</PinDetailTitle>
          </PinDetailHeaderMain>
        </PinDetailHeader>
      </PinDetailCard>
    </StoryFrame>
  ),
};
