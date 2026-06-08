import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { TaskProgress } from "./task-progress";

const DOWNLOAD_STEPS = [
  { id: "starred", label: "Export starred places", state: "done" as const },
  {
    id: "collections",
    label: "Export saved lists",
    state: "done" as const,
  },
  {
    id: "coordinates",
    label: "Resolve coordinates",
    state: "current" as const,
  },
];

const IMPORT_STEPS = [
  { id: "starred", label: "Starred places", state: "done" as const },
  { id: "klimmen", label: "Klimmen", state: "current" as const },
  { id: "coffee", label: "Coffee", state: "pending" as const },
];

const meta = {
  title: "Task progress",
  ...componentStoryMeta(
    "Long-running task status with phase text, progress bar, and optional step list.",
    "Set `status` to `unstarted`, `running`, `completed`, or `failed`. Pass `progress` (0–100) for a determinate bar while running; omit for indeterminate motion.",
  ),
  component: TaskProgress,
  decorators: [
    (Story) => (
      <StoryFrame width="md">
        <Story />
      </StoryFrame>
    ),
  ],
  args: {
    title: "Downloading from Google",
    phase: "Exporting saved lists…",
    detail: "We'll notify you here when your lists are ready to import.",
    status: "running",
  },
} satisfies Meta<typeof TaskProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unstarted: Story = {
  parameters: storyDocs(
    '`status="unstarted"` before a task begins — empty bar, muted icon.',
  ),
  args: {
    phase: "Not started",
    detail: "Download your Google Maps data to see your lists.",
    status: "unstarted",
    progress: 0,
    steps: DOWNLOAD_STEPS.map((step) => ({
      ...step,
      state: "pending" as const,
    })),
  },
};

export const RunningIndeterminate: Story = {
  parameters: storyDocs(
    '`status="running"` without `progress` — indeterminate bar motion.',
  ),
  args: {
    steps: DOWNLOAD_STEPS,
  },
};

export const RunningDeterminate: Story = {
  parameters: storyDocs(
    '`status="running"` with `progress` — determinate bar fill.',
  ),
  args: {
    title: "Importing to map",
    phase: "Importing Klimmen…",
    detail: "24 of 58 places · 18 added, 6 skipped",
    progress: 41,
    steps: IMPORT_STEPS,
  },
};

export const Completed: Story = {
  parameters: storyDocs(
    '`status="completed"` — check icon, full bar, success tint.',
  ),
  args: {
    title: "Importing to map",
    phase: "Import complete",
    detail: "58 added, 0 skipped. New pins are on your map.",
    status: "completed",
    progress: 100,
    steps: IMPORT_STEPS.map((step) => ({ ...step, state: "done" as const })),
  },
};

export const Failed: Story = {
  parameters: storyDocs(
    '`status="failed"` — error icon, destructive tint, partial bar optional.',
  ),
  args: {
    title: "Downloading from Google",
    phase: "Download failed",
    detail: "Google export timed out. Try again in a few minutes.",
    status: "failed",
    progress: 35,
    steps: [
      { id: "starred", label: "Export starred places", state: "done" },
      {
        id: "collections",
        label: "Export saved lists",
        state: "current",
      },
    ],
  },
};

export const WithoutSteps: Story = {
  parameters: storyDocs("Title, phase, and bar only — no step list."),
  args: {
    title: "Syncing",
    phase: "Preparing…",
    detail: undefined,
    progress: 12,
    steps: undefined,
  },
};
