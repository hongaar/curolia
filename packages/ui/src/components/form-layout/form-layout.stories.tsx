import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "../field";
import { Input } from "../input";
import { Select, SelectContent, SelectItem, SelectValue } from "../select";
import {
  FormActions,
  FormGrid,
  FormGrid2,
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
    `Wrap each control in \`Field\`. Use \`FormGrid2\` for two columns and \`FormActions\` for button rows.`,
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
          <Field>
            <FieldLabel htmlFor="story-form-name">Name</FieldLabel>
            <FieldControl>
              <Input id="story-form-name" placeholder="Summer 2025" />
            </FieldControl>
          </Field>
          <Field>
            <FieldLabel htmlFor="story-form-slug">Slug</FieldLabel>
            <FieldControl>
              <Input id="story-form-slug" placeholder="summer-2025" />
            </FieldControl>
          </Field>
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
        <Field>
          <FieldLabel htmlFor="story-form-actions-end">Name</FieldLabel>
          <FieldControl>
            <Input id="story-form-actions-end" placeholder="Summer 2025" />
          </FieldControl>
        </Field>
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
          <Field>
            <FieldLabel htmlFor="story-form-grid">Description</FieldLabel>
            <FieldControl>
              <Input id="story-form-grid" placeholder="Optional notes" />
            </FieldControl>
          </Field>
        </FormGrid>
      </FormSection>
    </StoryFrame>
  ),
};

export const HelpAndError: Story = {
  parameters: storyDocs(
    "`FieldDescription` help copy and `FieldError` validation messages.",
  ),
  render: () => (
    <StoryFrame width="md">
      <FormSection>
        <Field>
          <FieldLabel htmlFor="story-form-error">Email</FieldLabel>
          <FieldControl>
            <Input
              id="story-form-error"
              type="email"
              placeholder="you@example.com"
              aria-invalid
            />
          </FieldControl>
          <FieldDescription variant="body">
            We only use this for sharing invites.
          </FieldDescription>
          <FieldError>Enter a valid email address.</FieldError>
        </Field>
      </FormSection>
    </StoryFrame>
  ),
};

export const MutedTextSizes: Story = {
  parameters: storyDocs(
    "`FieldDescription` caption vs body variants for secondary copy.",
  ),
  render: () => (
    <StoryFrame width="md">
      <FormSection>
        <FieldDescription variant="body">
          Body-sized muted help text.
        </FieldDescription>
        <FieldDescription>Caption-sized muted text.</FieldDescription>
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
          <Field>
            <FieldLabel>Compact</FieldLabel>
            <FieldControl>
              <Select defaultValue="viewer" items={ROLE_ITEMS}>
                <FormSelectTriggerCompact>
                  <SelectValue />
                </FormSelectTriggerCompact>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </FieldControl>
          </Field>
          <Field>
            <FieldLabel>Rounded</FieldLabel>
            <FieldControl>
              <Select defaultValue="viewer" items={ROLE_ITEMS}>
                <FormSelectTriggerRounded>
                  <SelectValue />
                </FormSelectTriggerRounded>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </FieldControl>
          </Field>
          <Field>
            <FieldLabel>Invite</FieldLabel>
            <FieldControl>
              <Select defaultValue="viewer" items={ROLE_ITEMS}>
                <FormSelectTriggerInvite>
                  <SelectValue />
                </FormSelectTriggerInvite>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </FieldControl>
          </Field>
          <Field>
            <FieldLabel>Full width</FieldLabel>
            <FieldControl>
              <Select defaultValue="viewer" items={ROLE_ITEMS}>
                <FormSelectTriggerFull>
                  <SelectValue />
                </FormSelectTriggerFull>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </FieldControl>
          </Field>
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
        <Field>
          <FieldLabel htmlFor="story-form-file">
            <Button size="sm" variant="outline" type="button">
              Choose file
            </Button>
          </FieldLabel>
          <SrOnlyInput id="story-form-file" type="file" />
        </Field>
      </FormSection>
    </StoryFrame>
  ),
};
