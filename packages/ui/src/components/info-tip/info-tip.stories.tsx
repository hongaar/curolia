import type { Meta, StoryObj } from "@storybook/react";

import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { InfoTip } from "./info-tip";

const meta = {
  title: "Info tip",
  component: InfoTip,
  ...componentStoryMeta(
    "Inline trigger that shows a short explanation in a tooltip.",
    "Use after concise help text to move details out of the way, e.g. `Limited access. <InfoTip>…</InfoTip>`.",
  ),
  args: {
    label: "Learn more",
    children:
      "Signed-in users see your name and avatar and can request to follow you.",
  },
} satisfies Meta<typeof InfoTip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InlineWithText: Story = {
  render: (args) => (
    <p style={{ maxWidth: "20rem" }}>
      Followers you approve. <InfoTip {...args} />
    </p>
  ),
  ...storyDocs("Placed inline after short help text."),
};
