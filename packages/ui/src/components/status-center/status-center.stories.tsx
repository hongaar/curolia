import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import {
  StatusCenterLoader,
  StatusCenterMessage,
  StatusCenterPanel,
} from "./status-center";

const meta = {
  title: "Components/Status Center",
  ...componentStoryMeta(
    `Centered loading and message state over the map or app.`,
    `Use \`StatusCenterMessage\` for redirects and empty states.`,
  ),
  component: StatusCenterMessage,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Centered muted text for redirects and empty states."),
  render: () => <StatusCenterMessage>Opening trace…</StatusCenterMessage>,
};

export const Panel: Story = {
  parameters: storyDocs("Message inside a floating panel."),
  render: () => <StatusCenterPanel>Journal not found.</StatusCenterPanel>,
};

export const Loader: Story = {
  parameters: storyDocs("Branded splash used while journal data loads."),
  render: () => <StatusCenterLoader label="Loading journal" minHeight />,
};
