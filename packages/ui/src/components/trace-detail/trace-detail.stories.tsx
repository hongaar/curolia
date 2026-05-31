import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import {
  TraceDetailActions,
  TraceDetailCard,
  TraceDetailContent,
  TraceDetailDescription,
  TraceDetailHeader,
  TraceDetailSubtitle,
  TraceDetailTagBadge,
  TraceDetailTagRow,
  TraceDetailTitle,
} from "./trace-detail";

const meta = {
  title: "Trace Detail",
  ...componentStoryMeta(
    `Trace detail page badges, metadata, and section layout.`,
    `Import tag badges and detail sections for the trace page sidebar and body.`,
  ),
  component: TraceDetailCard,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Trace detail page card with tags and actions."),
  render: () => (
    <StoryFrame width="md">
      <TraceDetailCard>
        <TraceDetailHeader>
          <TraceDetailTitle>Café de Flore</TraceDetailTitle>
          <TraceDetailSubtitle>12 Jun 2025 · Paris</TraceDetailSubtitle>
        </TraceDetailHeader>
        <TraceDetailContent>
          <TraceDetailDescription>
            Morning coffee before exploring Saint-Germain-des-Prés.
          </TraceDetailDescription>
          <TraceDetailTagRow>
            <TraceDetailTagBadge style={{ background: "#3b82f6" }}>
              Food
            </TraceDetailTagBadge>
            <TraceDetailTagBadge>Paris</TraceDetailTagBadge>
          </TraceDetailTagRow>
          <TraceDetailActions>
            <Button size="sm">Edit trace</Button>
          </TraceDetailActions>
        </TraceDetailContent>
      </TraceDetailCard>
    </StoryFrame>
  ),
};
