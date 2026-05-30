import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { useStoryArgs } from "../../storybook/args";
import { storyFrameStyles } from "../../storybook/story-frame";
import { Label } from "../label";
import { Switch } from "./switch";

const meta = {
  title: "Components/Switch",
  ...componentStoryMeta(
    `Toggle for boolean settings.`,
    `Pair with \`Label\`. Prefer controlled state in settings forms.`,
  ),
  component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Controlled switch paired with a label."),
  args: {
    checked: false,
  },
  render: function Render() {
    const [{ checked }, updateArgs] = useStoryArgs<{ checked: boolean }>();
    return (
      <Label className={storyFrameStyles.labelGap}>
        <Switch
          checked={checked}
          onCheckedChange={(value) => updateArgs({ checked: value === true })}
        />
        {checked ? "Enabled" : "Disabled"}
      </Label>
    );
  },
};
