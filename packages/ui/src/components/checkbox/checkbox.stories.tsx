import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Label } from "../label";
import { Checkbox } from "./checkbox";

const meta = {
  title: "Checkbox",
  ...componentStoryMeta(
    `Boolean input with Curolia focus and invalid states.`,
    `Pair with \`Label\` and \`htmlFor\`. Use controlled mode when the parent form owns state.`,
  ),
  component: Checkbox,
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Controlled checkbox paired with a label."),
  args: {
    checked: false,
  },
  render: function Render() {
    const [{ checked }, updateArgs] = useStoryArgs<{ checked: boolean }>();
    return (
      <Label>
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => updateArgs({ checked: value === true })}
        />
        {checked ? "Checked" : "Unchecked"}
      </Label>
    );
  },
};

export const Checked: Story = {
  parameters: storyDocs("Pre-checked state."),
  args: { checked: true },
  render: function Render() {
    const [{ checked }, updateArgs] = useStoryArgs<{ checked: boolean }>();
    return (
      <Label>
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => updateArgs({ checked: value === true })}
        />
        Checked
      </Label>
    );
  },
};

export const Disabled: Story = {
  parameters: storyDocs("`disabled` blocks interaction."),
  args: { checked: false, disabled: true },
  render: (args) => (
    <Label>
      <Checkbox {...args} />
      Disabled
    </Label>
  ),
};

export const Invalid: Story = {
  parameters: storyDocs("`aria-invalid` for validation styling."),
  args: { checked: false, "aria-invalid": true },
  render: (args) => (
    <Label>
      <Checkbox {...args} />
      Invalid
    </Label>
  ),
};
