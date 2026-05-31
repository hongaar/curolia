import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Button } from "../button";
import {
  Page,
  PageContentStack,
  PageHeader,
  PageHeaderRow,
  PageTitle,
  PageMuted,
} from "./page";

const meta = {
  title: "Page",
  ...componentStoryMeta(
    `Settings and content page shell with floating panel width tokens.`,
    `Use \`PageRoot\`, \`PageHeader\`, \`PageTitle\`, and \`PageMuted\` for consistent settings pages.`,
  ),
  component: Page,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs(
    "Typical settings page with header and narrow content stack.",
  ),
  render: () => (
    <Page>
      <PageHeader>
        <PageHeaderRow>
          <PageTitle>Profile</PageTitle>
          <Button size="sm">Save</Button>
        </PageHeaderRow>
        <PageMuted>Update your display name and avatar.</PageMuted>
      </PageHeader>
      <PageContentStack width="narrow">
        <p style={{ margin: 0 }}>Form fields go here.</p>
      </PageContentStack>
    </Page>
  ),
};
