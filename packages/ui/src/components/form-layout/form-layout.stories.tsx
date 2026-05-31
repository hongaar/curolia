import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { StoryFrame } from "../../storybook/story-frame";
import { FormActions, FormField, FormGrid2, FormSection } from "./form-layout";

const meta = {
  title: "Form Layout",
  ...componentStoryMeta(
    `Form spacing primitives: fields, grids, actions, muted help text.`,
    `Wrap each control in \`FormField\`. Use \`FormGrid2\` for two columns and \`FormActions\` for button rows.`,
  ),
  component: FormSection,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Form section with labeled fields and actions."),
  render: () => (
    <StoryFrame width="md">
      <FormSection>
        <FormGrid2>
          <FormField>
            <Label htmlFor="story-form-name">Name</Label>
            <Input id="story-form-name" placeholder="Summer 2025" />
          </FormField>
          <FormField>
            <Label htmlFor="story-form-slug">Slug</Label>
            <Input id="story-form-slug" placeholder="summer-2025" />
          </FormField>
        </FormGrid2>
        <FormActions>
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </FormActions>
      </FormSection>
    </StoryFrame>
  ),
};
