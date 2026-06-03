import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { FormSelectTriggerFull } from "../form-layout";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select";

/** Value → label map for `<Select.Value>` (Base UI shows the raw `value` without this). */
const PLUGIN_ITEMS: ComponentProps<typeof Select>["items"] = {
  google_photos: "Google Photos",
  immich: "Immich",
  ical: "iCal feed",
};

const LOCATION_PREVIEW_ITEMS: ComponentProps<typeof Select>["items"] = {
  street_city_country: "Moi Avenue, Nairobi, Kenya",
  city_country: "Nairobi, Kenya",
  country: "Kenya",
};

const meta = {
  title: "Select",
  ...componentStoryMeta(
    `Single-choice dropdown built on Base UI Select.`,
    `Provide an \`items\` map (value → label) on \`Select\` so \`SelectValue\` renders labels. \`SelectContent\` defaults to \`align="start"\`; list padding applies to grouped and flat item lists.`,
  ),
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grouped: Story = {
  parameters: storyDocs(
    "Options inside `SelectGroup` with `SelectLabel` (plugin picker pattern).",
  ),
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

export const FlatList: Story = {
  parameters: storyDocs(
    "Flat `SelectItem` list without a group (pin location label pattern).",
  ),
  render: () => (
    <StoryFrame width="md">
      <Select defaultValue="city_country" items={LOCATION_PREVIEW_ITEMS}>
        <FormSelectTriggerFull>
          <SelectValue placeholder="Choose location label" />
        </FormSelectTriggerFull>
        <SelectContent>
          <SelectItem value="street_city_country">
            Moi Avenue, Nairobi, Kenya
          </SelectItem>
          <SelectItem value="city_country">Nairobi, Kenya</SelectItem>
          <SelectItem value="country">Kenya</SelectItem>
        </SelectContent>
      </Select>
    </StoryFrame>
  ),
};

export const TriggerSizes: Story = {
  parameters: storyDocs(
    "`SelectTrigger` `size`: `default` (32px) and `sm` (28px).",
  ),
  render: () => (
    <StoryFrame width="md">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <Select defaultValue="ical" items={PLUGIN_ITEMS}>
          <SelectTrigger size="default">
            <SelectValue placeholder="Default size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google_photos">Google Photos</SelectItem>
            <SelectItem value="immich">Immich</SelectItem>
            <SelectItem value="ical">iCal feed</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="ical" items={PLUGIN_ITEMS}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Small" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google_photos">Google Photos</SelectItem>
            <SelectItem value="immich">Immich</SelectItem>
            <SelectItem value="ical">iCal feed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </StoryFrame>
  ),
};

export const Disabled: Story = {
  parameters: storyDocs("Disabled root `Select` and trigger."),
  render: () => (
    <Select disabled defaultValue="ical" items={PLUGIN_ITEMS}>
      <SelectTrigger>
        <SelectValue placeholder="Choose plugin" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ical">iCal feed</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const AlignStart: Story = {
  parameters: storyDocs(
    'Default `SelectContent` alignment: `align="start"` (menu flush with trigger left).',
  ),
  render: () => (
    <StoryFrame width="md">
      <Select defaultValue="city_country" items={LOCATION_PREVIEW_ITEMS}>
        <FormSelectTriggerFull>
          <SelectValue />
        </FormSelectTriggerFull>
        <SelectContent align="start">
          <SelectItem value="city_country">Nairobi, Kenya</SelectItem>
          <SelectItem value="country">Kenya</SelectItem>
        </SelectContent>
      </Select>
    </StoryFrame>
  ),
};

export const AlignCenter: Story = {
  parameters: storyDocs('`SelectContent` with `align="center"`.'),
  render: () => (
    <StoryFrame width="md">
      <Select defaultValue="city_country" items={LOCATION_PREVIEW_ITEMS}>
        <FormSelectTriggerFull>
          <SelectValue />
        </FormSelectTriggerFull>
        <SelectContent align="center">
          <SelectItem value="city_country">Nairobi, Kenya</SelectItem>
          <SelectItem value="country">Kenya</SelectItem>
        </SelectContent>
      </Select>
    </StoryFrame>
  ),
};

export const AlignItemWithTrigger: Story = {
  parameters: storyDocs(
    "`alignItemWithTrigger` sizes the menu to the trigger width (Base UI).",
  ),
  render: () => (
    <StoryFrame width="md">
      <Select defaultValue="city_country" items={LOCATION_PREVIEW_ITEMS}>
        <FormSelectTriggerFull>
          <SelectValue />
        </FormSelectTriggerFull>
        <SelectContent alignItemWithTrigger>
          <SelectItem value="city_country">Nairobi, Kenya</SelectItem>
          <SelectItem value="country">Kenya</SelectItem>
        </SelectContent>
      </Select>
    </StoryFrame>
  ),
};

export const Controlled: Story = {
  parameters: storyDocs("Controlled value via story args."),
  args: { value: "ical" },
  render: function Render() {
    const [{ value }, updateArgs] = useStoryArgs<{ value: string }>();
    const current = value ?? "ical";

    return (
      <Select
        value={current}
        onValueChange={(v) => updateArgs({ value: v ?? "ical" })}
        items={PLUGIN_ITEMS}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose plugin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="google_photos">Google Photos</SelectItem>
          <SelectItem value="immich">Immich</SelectItem>
          <SelectItem value="ical">iCal feed</SelectItem>
        </SelectContent>
      </Select>
    );
  },
};

/** @deprecated Use `Grouped` — kept as alias for older story URLs. */
export const Default: Story = Grouped;
