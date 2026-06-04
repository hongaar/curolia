import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import {
  PinDetailActions,
  PinDetailCard,
  PinDetailContent,
  PinDetailDescription,
  PinDetailHeader,
  PinDetailHeaderMain,
  PinDetailSubtitle,
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
