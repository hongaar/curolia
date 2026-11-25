import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Input } from "../input";
import {
  PinMetadataEditorAddMenu,
  PinMetadataEditorForm,
  PinMetadataEditorFormRow,
  PinMetadataEditorList,
  PinMetadataEditorRoot,
  PinMetadataEditorRow,
  type PinMetadataEditorAddGroup,
} from "./pin-metadata-editor";

const noop = () => {};

const ADD_GROUPS: PinMetadataEditorAddGroup[] = [
  {
    label: "Place",
    items: [
      { fieldKey: "cuisine", label: "Cuisine" },
      { fieldKey: "dietary_options", label: "Dietary" },
    ],
  },
  {
    label: "Contact",
    items: [
      { fieldKey: "phone", label: "Phone" },
      { fieldKey: "email", label: "Email" },
    ],
  },
];

const meta = {
  title: "Pin Metadata Editor",
  ...componentStoryMeta(
    `Editable list of structured pin details (type, hours, contact, …).`,
    `Render a \`PinMetadataEditorRow\` per set field and swap it for \`PinMetadataEditorForm\` while editing. \`PinMetadataEditorAddMenu\` lists fields that are not set yet; selecting one opens a form.`,
  ),
  component: PinMetadataEditorRow,
  args: {
    fieldKey: "place_type",
    label: "Type",
    value: "Café",
    source: "POI",
    onEdit: noop,
    onRemove: noop,
  },
} satisfies Meta<typeof PinMetadataEditorRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Row: Story = {
  parameters: storyDocs("Single field row with source badge and actions."),
  render: (args) => (
    <StoryFrame width="md">
      <PinMetadataEditorRow {...args} />
    </StoryFrame>
  ),
};

export const Removing: Story = {
  parameters: storyDocs("Remove in progress; actions disabled."),
  args: { removing: true, source: undefined },
  render: (args) => (
    <StoryFrame width="md">
      <PinMetadataEditorRow {...args} />
    </StoryFrame>
  ),
};

export const WithList: Story = {
  parameters: storyDocs(
    "Current fields, an open inline form, and the add-detail menu.",
  ),
  render: () => (
    <StoryFrame width="md">
      <PinMetadataEditorRoot>
        <PinMetadataEditorList>
          <PinMetadataEditorRow
            fieldKey="place_type"
            label="Type"
            value="Café"
            source="POI"
            onEdit={noop}
            onRemove={noop}
          />
          <PinMetadataEditorRow
            fieldKey="opening_hours"
            label="Hours"
            value={"Mo-Fr 08:00-18:00\nSa 09:00-14:00"}
            onEdit={noop}
            onRemove={noop}
          />
          <PinMetadataEditorForm
            fieldKey="website"
            label="Website"
            onSubmit={noop}
            onCancel={noop}
          >
            <PinMetadataEditorFormRow>
              <Input placeholder="https://example.com" />
              <Input placeholder="Label (optional)" />
            </PinMetadataEditorFormRow>
          </PinMetadataEditorForm>
        </PinMetadataEditorList>
        <PinMetadataEditorAddMenu groups={ADD_GROUPS} onSelect={noop} />
      </PinMetadataEditorRoot>
    </StoryFrame>
  ),
};

export const Empty: Story = {
  parameters: storyDocs("No fields yet: only the add-detail menu."),
  render: () => (
    <StoryFrame width="md">
      <PinMetadataEditorRoot>
        <PinMetadataEditorAddMenu groups={ADD_GROUPS} onSelect={noop} />
      </PinMetadataEditorRoot>
    </StoryFrame>
  ),
};
