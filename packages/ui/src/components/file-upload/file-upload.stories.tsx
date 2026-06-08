import type { Meta, StoryObj } from "@storybook/react";
import { Upload } from "lucide-react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { FileUploadInput, FileUploadLabel, FileUploadRow } from "./file-upload";

const meta = {
  title: "File Upload",
  ...componentStoryMeta(
    `Visually hidden file input with a styled label trigger.`,
    `Compose \`FileUploadRow\` → \`FileUploadLabel\` (pass \`input={<FileUploadInput … />}\`) → label content.`,
  ),
  component: FileUploadRow,
  decorators: [
    (Story) => (
      <StoryFrame width="md">
        <Story />
      </StoryFrame>
    ),
  ],
} satisfies Meta<typeof FileUploadRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Single file picker with icon + text label."),
  render: () => (
    <FileUploadRow>
      <FileUploadLabel input={<FileUploadInput type="file" accept="image/*" />}>
        <Upload aria-hidden />
        <span>Upload photos</span>
      </FileUploadLabel>
    </FileUploadRow>
  ),
};

export const Multiple: Story = {
  parameters: storyDocs(
    "`multiple` on the hidden input for multi-file selection.",
  ),
  render: () => (
    <FileUploadRow>
      <FileUploadLabel
        input={<FileUploadInput type="file" accept="image/*" multiple />}
      >
        <Upload aria-hidden />
        <span>Upload photos</span>
      </FileUploadLabel>
    </FileUploadRow>
  ),
};

export const WithExtraActions: Story = {
  parameters: storyDocs(
    "Row wraps the upload label alongside other actions (e.g. plugin import slots).",
  ),
  render: () => (
    <FileUploadRow>
      <FileUploadLabel
        input={<FileUploadInput type="file" accept="image/*" multiple />}
      >
        <Upload aria-hidden />
        <span>Upload photos</span>
      </FileUploadLabel>
      <Button type="button" variant="outline" size="sm">
        Import from Google Photos
      </Button>
    </FileUploadRow>
  ),
};
