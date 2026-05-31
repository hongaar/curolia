import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { useStoryArgs } from "../../storybook/args";
import { TracePhotoLightbox } from "./trace-photo-lightbox";

const sampleItems = [
  {
    id: "1",
    url: "https://picsum.photos/seed/curolia1/1200/800",
    originalProductUrl: "https://example.com/photo/1",
  },
  {
    id: "2",
    url: "https://picsum.photos/seed/curolia2/1200/800",
  },
] as const;

const meta = {
  title: "Trace Photo Lightbox",
  ...componentStoryMeta(
    `Full-screen photo viewer with prev/next and external link.`,
    `Control open state from parent; pass photo URLs and index handlers.`,
  ),
  component: TracePhotoLightbox,
} satisfies Meta<typeof TracePhotoLightbox>;

export default meta;
type Story = StoryObj<typeof meta>;

type LightboxArgs = Omit<
  ComponentProps<typeof TracePhotoLightbox>,
  "onOpenChange"
>;

export const Default: Story = {
  parameters: storyDocs("Full-screen photo viewer with prev/next navigation."),
  args: {
    open: true,
    items: [...sampleItems],
    title: "Trace photos",
    onOpenChange: () => undefined,
  },
  render: function Render() {
    const [args, updateArgs] = useStoryArgs<LightboxArgs>();
    return (
      <TracePhotoLightbox
        {...args}
        onOpenChange={(open) => updateArgs({ open })}
      />
    );
  },
};
