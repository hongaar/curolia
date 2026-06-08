import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { Input } from "../input";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "./field";

const meta = {
  title: "Field",
  ...componentStoryMeta(
    "Composable form field layout with label, control, help text, and error message.",
    "Compose with `FieldLabel`, `FieldControl`, `FieldDescription`, and `FieldError`. `FieldControl` wires `aria-describedby` onto a single child control.",
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Label + input with optional description."),
  render: () => (
    <Field>
      <FieldLabel htmlFor="name">Map name</FieldLabel>
      <FieldControl>
        <Input id="name" placeholder="My map" />
      </FieldControl>
      <FieldDescription>A short name for your adventure map.</FieldDescription>
    </Field>
  ),
};

export const WithError: Story = {
  parameters: storyDocs("Error message uses destructive color and role=alert."),
  render: () => (
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <FieldControl>
        <Input
          id="email"
          type="email"
          aria-invalid
          defaultValue="not-an-email"
        />
      </FieldControl>
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  ),
};
