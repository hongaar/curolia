import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { useStoryArgs } from "../../storybook/args";
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
        {checked ? "Enabled" : "Disabled"}
      </Label>
    );
  },
};
