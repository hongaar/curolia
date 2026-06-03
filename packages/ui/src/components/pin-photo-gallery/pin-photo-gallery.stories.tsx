import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { PluginIconFrame } from "../plugin-icon-frame";
import { PinPhotoGallery } from "./pin-photo-gallery";

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
    url: "https://picsum.photos/seed/curolia-g1/800/1200",
    width: 800,
    height: 1200,
    originalProductUrl: "https://photos.google.com/photo/example1",
    sourceIcon: <SampleGoogleIcon />,
    sourceLabel: "Open in Google Photos",
  },
  {
    id: "2",
    url: "https://picsum.photos/seed/curolia-g2/900/600",
    width: 900,
    height: 600,
  },
  {
    id: "3",
    url: "https://picsum.photos/seed/curolia-g3/700/900",
    width: 700,
    height: 900,
    originalProductUrl: "https://photos.google.com/photo/example3",
    sourceIcon: <SampleGoogleIcon />,
    sourceLabel: "Open in Google Photos",
  },
  {
    id: "4",
    url: "https://picsum.photos/seed/curolia-g4/800/500",
    width: 800,
    height: 500,
  },
  {
    id: "5",
    url: "https://picsum.photos/seed/curolia-g5/1000/1000",
    width: 1000,
    height: 1000,
  },
  {
    id: "6",
    url: "https://picsum.photos/seed/curolia-g6/1600/600",
    width: 1600,
    height: 600,
  },
  {
    id: "7",
    url: "https://picsum.photos/seed/curolia-g7/600/1400",
    width: 600,
    height: 1400,
    originalProductUrl: "https://photos.google.com/photo/example7",
    sourceIcon: <SampleGoogleIcon />,
    sourceLabel: "Open in Google Photos",
  },
  {
    id: "8",
    url: "https://picsum.photos/seed/curolia-g8/1200/900",
    width: 1200,
    height: 900,
  },
  {
    id: "9",
    url: "https://picsum.photos/seed/curolia-g9/1100/750",
    width: 1100,
    height: 750,
  },
  {
    id: "10",
    url: "https://picsum.photos/seed/curolia-g10/750/1100",
    width: 750,
    height: 1100,
  },
  {
    id: "11",
    url: "https://picsum.photos/seed/curolia-g11/1400/400",
    width: 1400,
    height: 400,
  },
  {
    id: "12",
    url: "https://picsum.photos/seed/curolia-g12/640/960",
    width: 640,
    height: 960,
    originalProductUrl: "https://photos.google.com/photo/example12",
    sourceIcon: <SampleGoogleIcon />,
    sourceLabel: "Open in Google Photos",
  },
];

const meta = {
  title: "Pin Photo Gallery",
  ...componentStoryMeta(
    "Photo grid for pin detail with rows, columns, or masonry layout.",
    "Pass signed URLs and optional width/height for justified rows and columns.",
  ),
  component: PinPhotoGallery,
  args: {
    items: [...sampleItems],
    onOpen: () => undefined,
    layout: "rows",
  },
} satisfies Meta<typeof PinPhotoGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  args: { layout: "rows" },
  parameters: storyDocs(
    "Justified rows (default): each row fills the width at a responsive target height.",
  ),
};

export const Columns: Story = {
  args: { layout: "columns" },
  parameters: storyDocs(
    "Fixed column count by viewport; photos flow top-to-bottom in each column.",
  ),
};

export const Masonry: Story = {
  args: { layout: "masonry" },
  parameters: storyDocs(
    "CSS column masonry with natural image heights (previous default).",
  ),
};
