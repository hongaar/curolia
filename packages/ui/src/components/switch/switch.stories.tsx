import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { storyFrameStyles } from "../../storybook/story-frame";
import { Label } from "../label";
import { Switch } from "./switch";

const meta = {
  title: "Switch",
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
    size: "default",
  },
  render: function Render() {
    const [{ checked, size }, updateArgs] = useStoryArgs<{
      checked: boolean;
      size: "sm" | "default";
    }>();
    return (
      <Label className={storyFrameStyles.labelGap}>
        <Switch
          size={size}
          checked={checked}
          onCheckedChange={(value) => updateArgs({ checked: value === true })}
        />
        {checked ? "On" : "Off"}
      </Label>
    );
  },
};

export const Small: Story = {
  parameters: storyDocs('`size="sm"` compact switch.'),
  args: { checked: false, size: "sm" },
  render: function Render() {
    const [{ checked }, updateArgs] = useStoryArgs<{ checked: boolean }>();
    return (
      <Label className={storyFrameStyles.labelGap}>
        <Switch
          size="sm"
          checked={checked}
          onCheckedChange={(value) => updateArgs({ checked: value === true })}
        />
        Small
      </Label>
    );
  },
};

export const Checked: Story = {
  parameters: storyDocs("Pre-checked switch."),
  args: { checked: true },
  render: function Render() {
    const [{ checked }, updateArgs] = useStoryArgs<{ checked: boolean }>();
    return (
      <Label className={storyFrameStyles.labelGap}>
        <Switch
          checked={checked}
          onCheckedChange={(value) => updateArgs({ checked: value === true })}
        />
        On
      </Label>
    );
  },
};

export const Disabled: Story = {
  parameters: storyDocs("`disabled` blocks interaction."),
  args: { checked: false, disabled: true },
  render: (args) => (
    <Label className={storyFrameStyles.labelGap}>
      <Switch {...args} />
      Disabled
    </Label>
  ),
};
