import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { BulletList } from "./bullet-list";

const meta = {
  title: "Bullet List",
  ...componentStoryMeta(
    `Muted disc bullet list for short supporting copy.`,
    `Render \`<li>\` children directly inside \`BulletList\`.`,
  ),
  component: BulletList,
  decorators: [
    (Story) => (
      <StoryFrame width="md">
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta<typeof BulletList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Typical use in dialogs or form descriptions."),
  render: () => (
    <BulletList>
      <li>All tags will be removed from this pin.</li>
      <li>Tags belong to a map and do not carry over.</li>
    </BulletList>
  ),
};
