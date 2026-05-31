import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Tooltip, TooltipContent, TooltipTitle } from "./tooltip";

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
