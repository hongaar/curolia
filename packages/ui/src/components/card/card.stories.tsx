import type * as React from "react";
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

export const TitleWithAction: Story = {
  parameters: storyDocs(
    "Title and trailing action only — no extra header grid row.",
  ),
  render: () => (
    <StoryFrame width="md">
      <Card>
        <CardHeader>
          <CardTitle>Pin settings</CardTitle>
          <CardAction>
            <Button size="icon-sm" variant="ghost" aria-label="Close">
              ×
            </Button>
          </CardAction>
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

export const Colored: Story = {
  parameters: storyDocs(
    '`variant="colored"` accent surface for suggestions and highlights.',
  ),
  render: () => (
    <StoryFrame width="sm">
      <Card variant="colored" size="sm">
        <CardHeader>
          <CardTitle>Suggested place</CardTitle>
          <CardDescription>Restaurant · 18 m away</CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ margin: 0 }}>Café de Klos</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Attach place</Button>
        </CardFooter>
      </Card>
    </StoryFrame>
  ),
};

export const Focused: Story = {
  parameters: storyDocs(
    "Focusable card (`tabIndex={0}`): ring-colored border plus a soft halo, matching `Button` focus. Tab into it to see the ring.",
  ),
  render: () => (
    <StoryFrame width="md">
      <Card tabIndex={0}>
        <CardHeader>
          <CardTitle>Focusable card</CardTitle>
          <CardDescription>Tab here to show the focus ring.</CardDescription>
        </CardHeader>
      </Card>
    </StoryFrame>
  ),
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLElement>("[tabindex]")?.focus();
  },
};

export const Interactive: Story = {
  parameters: storyDocs(
    "`interactive` tile rendered as a link/button: hover lift, Button-style focus ring (border + halo). `active` shows the ring without focus; tint it via `--card-focus-color`.",
  ),
  render: () => (
    <StoryFrame width="md">
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <Card interactive render={<button type="button" />}>
          <CardContent>Hover or Tab to me</CardContent>
        </Card>
        <Card interactive active render={<button type="button" />}>
          <CardContent>Active</CardContent>
        </Card>
        <Card
          interactive
          active
          render={<button type="button" />}
          style={{ "--card-focus-color": "#ff851b" } as React.CSSProperties}
        >
          <CardContent>Active, custom focus color</CardContent>
        </Card>
      </div>
    </StoryFrame>
  ),
};
