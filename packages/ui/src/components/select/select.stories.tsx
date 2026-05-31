import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import type { ComponentProps } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

/** Value → label map for `<Select.Value>` (Base UI shows the raw `value` without this). */
const PLUGIN_ITEMS: ComponentProps<typeof Select>["items"] = {
  google_photos: "Google Photos",
  immich: "Immich",
  ical: "iCal feed",
};

const meta = {
  title: "Select",
  ...componentStoryMeta(
    `Single-choice dropdown built on Base UI Select.`,
    `Provide an \`items\` map (value → label) on \`Select\` so \`SelectValue\` renders labels. Group options with \`SelectGroup\` and \`SelectLabel\`.`,
  ),
  component: Select,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Single-choice select with value-to-label mapping."),
  render: () => (
    <Select defaultValue="google_photos" items={PLUGIN_ITEMS}>
      <SelectTrigger>
        <SelectValue placeholder="Choose plugin" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Plugins</SelectLabel>
          <SelectItem value="google_photos">Google Photos</SelectItem>
          <SelectItem value="immich">Immich</SelectItem>
          <SelectItem value="ical">iCal feed</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
