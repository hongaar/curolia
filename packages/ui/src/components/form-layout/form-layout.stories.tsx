import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Select, SelectContent, SelectItem, SelectValue } from "../select";
import {
  FormActions,
  FormErrorText,
  FormField,
  FormGrid,
  FormGrid2,
  FormMutedText,
  FormMutedTextXs,
  FormSection,
  FormSelectTriggerCompact,
  FormSelectTriggerFull,
  FormSelectTriggerInvite,
  FormSelectTriggerRounded,
  SrOnlyInput,
} from "./form-layout";

const ROLE_ITEMS = {
  viewer: "Viewer",
  editor: "Editor",
} as const;

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

export const ActionsEnd: Story = {
  parameters: storyDocs('`FormActions align="end"` right-aligns buttons.'),
  render: () => (
    <StoryFrame width="md">
      <FormSection>
        <FormField>
          <Label htmlFor="story-form-actions-end">Name</Label>
          <Input id="story-form-actions-end" placeholder="Summer 2025" />
        </FormField>
        <FormActions align="end">
          <Button variant="outline">Cancel</Button>
          <Button>Save</Button>
        </FormActions>
      </FormSection>
    </StoryFrame>
  ),
};

export const SingleColumnGrid: Story = {
  parameters: storyDocs("`FormGrid` for a single flexible column."),
  render: () => (
    <StoryFrame width="md">
      <FormSection>
        <FormGrid>
          <FormField>
            <Label htmlFor="story-form-grid">Description</Label>
            <Input id="story-form-grid" placeholder="Optional notes" />
          </FormField>
        </FormGrid>
      </FormSection>
    </StoryFrame>
  ),
};

export const HelpAndError: Story = {
  parameters: storyDocs(
    "`FormMutedText` help copy and `FormErrorText` errors.",
  ),
  render: () => (
    <StoryFrame width="md">
      <FormSection>
        <FormField>
          <Label htmlFor="story-form-error">Email</Label>
          <Input
            id="story-form-error"
            type="email"
            placeholder="you@example.com"
            aria-invalid
          />
          <FormMutedText>We only use this for sharing invites.</FormMutedText>
          <FormErrorText>Enter a valid email address.</FormErrorText>
        </FormField>
      </FormSection>
    </StoryFrame>
  ),
};

export const MutedTextSizes: Story = {
  parameters: storyDocs(
    "`FormMutedText` vs `FormMutedTextXs` for secondary copy.",
  ),
  render: () => (
    <StoryFrame width="md">
      <FormSection>
        <FormMutedText>Standard muted help text.</FormMutedText>
        <FormMutedTextXs>Extra-small muted caption.</FormMutedTextXs>
      </FormSection>
    </StoryFrame>
  ),
};

export const SelectTriggerVariants: Story = {
  parameters: storyDocs("Form-scoped select trigger styles."),
  render: () => (
    <StoryFrame width="md">
      <FormSection>
        <FormGrid2>
          <FormField>
            <Label>Compact</Label>
            <Select defaultValue="viewer" items={ROLE_ITEMS}>
              <FormSelectTriggerCompact>
                <SelectValue />
              </FormSelectTriggerCompact>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField>
            <Label>Rounded</Label>
            <Select defaultValue="viewer" items={ROLE_ITEMS}>
              <FormSelectTriggerRounded>
                <SelectValue />
              </FormSelectTriggerRounded>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField>
            <Label>Invite</Label>
            <Select defaultValue="viewer" items={ROLE_ITEMS}>
              <FormSelectTriggerInvite>
                <SelectValue />
              </FormSelectTriggerInvite>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField>
            <Label>Full width</Label>
            <Select defaultValue="viewer" items={ROLE_ITEMS}>
              <FormSelectTriggerFull>
                <SelectValue />
              </FormSelectTriggerFull>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </FormGrid2>
      </FormSection>
    </StoryFrame>
  ),
};

export const SrOnlyFileInput: Story = {
  parameters: storyDocs(
    "Visually hidden file input pattern with a visible label button.",
  ),
  render: () => (
    <StoryFrame width="md">
      <FormSection>
        <FormField>
          <Label htmlFor="story-form-file">
            <Button size="sm" variant="outline" type="button">
              Choose file
            </Button>
          </Label>
          <SrOnlyInput id="story-form-file" type="file" />
        </FormField>
      </FormSection>
    </StoryFrame>
  ),
};
