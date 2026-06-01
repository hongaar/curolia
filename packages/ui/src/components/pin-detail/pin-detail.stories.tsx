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
          <PinDetailTitle>Café de Flore</PinDetailTitle>
          <PinDetailSubtitle>12 Jun 2025 · Paris</PinDetailSubtitle>
        </PinDetailHeader>
        <PinDetailContent>
          <PinDetailDescription>
            Morning coffee before exploring Saint-Germain-des-Prés.
          </PinDetailDescription>
          <PinDetailTagRow>
            <PinDetailTagBadge style={{ background: "#3b82f6" }}>
              Food
            </PinDetailTagBadge>
            <PinDetailTagBadge>Paris</PinDetailTagBadge>
          </PinDetailTagRow>
          <PinDetailActions>
            <Button size="sm">Edit pin</Button>
          </PinDetailActions>
        </PinDetailContent>
      </PinDetailCard>
    </StoryFrame>
  ),
};
