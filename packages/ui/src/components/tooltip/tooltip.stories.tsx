import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import {
  Tooltip,
  TooltipContent,
  TooltipDescription,
  TooltipTitle,
} from "./tooltip";

const meta = {
  title: "Tooltip",
  ...componentStoryMeta(
    "Lightweight tooltip shell for externally positioned anchors (Floating UI, map hover).",
    "Set `position: fixed` and coordinates on the host from your layout layer.",
  ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Tooltip content next to a map marker."),
  render: () => (
    <div style={{ position: "relative", margin: "2rem" }}>
      <Tooltip>
        <TooltipContent>
          <TooltipTitle>Café de Flore</TooltipTitle>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const FixedPosition: Story = {
  parameters: storyDocs(
    "Fixed coordinates on the host (map hover / Floating UI pattern).",
  ),
  render: () => (
    <div style={{ position: "fixed", top: 80, left: 120 }}>
      <Tooltip>
        <TooltipContent>
          <TooltipTitle>Café de Flore</TooltipTitle>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const LongTitle: Story = {
  parameters: storyDocs("Multi-line tooltip content."),
  render: () => (
    <div style={{ position: "relative", margin: "2rem" }}>
      <Tooltip>
        <TooltipContent>
          <TooltipTitle>
            Café de Flore — Saint-Germain-des-Prés, Paris
          </TooltipTitle>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};

export const WithDescription: Story = {
  parameters: storyDocs(
    "Title plus secondary hint (e.g. overlapping map markers).",
  ),
  render: () => (
    <div style={{ position: "relative", margin: "2rem" }}>
      <Tooltip>
        <TooltipContent>
          <TooltipTitle>Café de Flore + 5 more</TooltipTitle>
          <TooltipDescription>Click to choose a pin</TooltipDescription>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
};
