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
  title: "Components/Card",
  ...componentStoryMeta(
    `Grouped content surface with header, body, and footer regions.`,
    `Compose \`Card\`, \`CardHeader\`, \`CardTitle\`, \`CardDescription\`, \`CardContent\`, and \`CardFooter\`. Use for trace panels, plugin blocks, and settings sections.`,
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
          <CardTitle>Trace settings</CardTitle>
          <CardDescription>Configure metadata for this trace.</CardDescription>
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
