import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { CautionPanel } from "./caution-panel";

const meta = {
  title: "Components/Caution Panel",
  ...componentStoryMeta(
    `Highlighted warning block for destructive or irreversible actions.`,
    `Pass \`title\` and optional \`description\`; place the primary action in \`children\` (e.g. a destructive Button).`,
  ),
  component: CautionPanel,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs(
    "Warning panel for destructive or irreversible actions.",
  ),
  render: () => (
    <StoryFrame width="md">
      <CautionPanel
        title="Delete journal"
        description="All traces in this journal will be permanently removed."
      >
        <Button variant="destructive">Delete journal</Button>
      </CautionPanel>
    </StoryFrame>
  ),
};
