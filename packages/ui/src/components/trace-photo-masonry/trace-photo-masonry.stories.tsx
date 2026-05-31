import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { PluginIconFrame } from "../plugin-icon-frame";
import { TracePhotoMasonry } from "./trace-photo-masonry";

function SampleGoogleIcon() {
  return (
    <PluginIconFrame size={4}>
      <svg viewBox="0 0 59 59" aria-hidden width="100%" height="100%">
        <path
          fill="#FBBC04"
          d="M14.75 13.41c8.146 0 14.75 6.603 14.75 14.75v1.34H1.34C.6 29.5 0 28.9 0 28.16c0-8.147 6.604-14.75 14.75-14.75z"
        />
        <path
          fill="#EA4335"
          d="M45.59 14.75c0 8.146-6.603 14.75-14.75 14.75H29.5V1.34C29.5.6 30.1 0 30.84 0c8.147 0 14.75 6.604 14.75 14.75z"
        />
        <path
          fill="#4285F4"
          d="M44.25 45.59c-8.146 0-14.75-6.603-14.75-14.75V29.5h28.16c.74 0 1.34.6 1.34 1.34 0 8.147-6.604 14.75-14.75 14.75z"
        />
        <path
          fill="#34A853"
          d="M13.41 44.25c0-8.146 6.603-14.75 14.75-14.75h1.34v28.16c0 .74-.6 1.34-1.34 1.34-8.147 0-14.75-6.604-14.75-14.75z"
        />
      </svg>
    </PluginIconFrame>
  );
}

const sampleItems = [
  {
    id: "1",
    url: "https://picsum.photos/seed/curolia-m1/800/1200",
    originalProductUrl: "https://photos.google.com/photo/example1",
    sourceIcon: <SampleGoogleIcon />,
    sourceLabel: "Open in Google Photos",
  },
  {
    id: "2",
    url: "https://picsum.photos/seed/curolia-m2/900/600",
  },
  {
    id: "3",
    url: "https://picsum.photos/seed/curolia-m3/700/900",
    originalProductUrl: "https://photos.google.com/photo/example3",
    sourceIcon: <SampleGoogleIcon />,
    sourceLabel: "Open in Google Photos",
  },
  {
    id: "4",
    url: "https://picsum.photos/seed/curolia-m4/800/500",
  },
] as const;

const meta = {
  title: "Trace Photo Masonry",
  ...componentStoryMeta(
    "Masonry photo grid for trace detail with hover affordance and optional source links.",
    "Pass signed URLs and optional plugin icon links to original product pages.",
  ),
  component: TracePhotoMasonry,
  args: {
    items: [...sampleItems],
    onOpen: () => undefined,
  },
} satisfies Meta<typeof TracePhotoMasonry>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs(
    "Column masonry with mixed aspect ratios and source badges.",
  ),
};
