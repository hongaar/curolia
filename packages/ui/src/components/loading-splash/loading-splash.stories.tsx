import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { CuroliaLoadingSplash } from "./loading-splash";

const meta = {
  title: "Components/Loading Splash",
  ...componentStoryMeta(
    `Full-viewport branded loader while auth or journal data resolves.`,
    `Render once in the protected route layout until the app is ready.`,
  ),
  component: CuroliaLoadingSplash,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    layout: "fullscreen",
    ...storyDocs("Full-viewport branded loading splash."),
  },
  render: () => <CuroliaLoadingSplash />,
};
