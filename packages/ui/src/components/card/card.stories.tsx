import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "Card",
  ...componentStoryMeta(
    `Grouped content surface with header, body, and footer regions.`,
    `Compose \`Card\`, \`CardHeader\`, \`CardTitle\`, \`CardDescription\`, \`CardContent\`, and \`CardFooter\`. Use for pin panels, plugin blocks, and settings sections.`,
  ),
  component: Card,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: storyDocs("Card with header, description, content, and footer."),
  render: () => (
    <StoryFrame width="md">
      <Card>
        <CardHeader>
          <CardTitle>Pin settings</CardTitle>
          <CardDescription>Configure metadata for this pin.</CardDescription>
          <CardAction>
            <Button size="sm" variant="outline">
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p style={{ margin: 0 }}>Card body content.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Save</Button>
        </CardFooter>
      </Card>
    </StoryFrame>
  ),
};

export const Small: Story = {
  parameters: storyDocs('`size="sm"` compact card padding.'),
  render: () => (
    <StoryFrame width="md">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Compact card</CardTitle>
          <CardDescription>Smaller inner spacing.</CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ margin: 0 }}>Card body content.</p>
        </CardContent>
      </Card>
    </StoryFrame>
  ),
};

export const ContentOnly: Story = {
  parameters: storyDocs("Content region without header or footer."),
  render: () => (
    <StoryFrame width="md">
      <Card>
        <CardContent>
          <p style={{ margin: 0 }}>Standalone card body.</p>
        </CardContent>
      </Card>
    </StoryFrame>
  ),
};
