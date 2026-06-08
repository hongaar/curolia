import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "../input";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "./field";

describe("Field", () => {
  it("renders composed label, control, and description", () => {
    render(
      <Field>
        <FieldLabel htmlFor="name">Map name</FieldLabel>
        <FieldControl>
          <Input id="name" />
        </FieldControl>
        <FieldDescription>A short name for your map.</FieldDescription>
      </Field>,
    );
    expect(screen.getByText("Map name")).toBeInTheDocument();
    expect(screen.getByText("A short name for your map.")).toBeInTheDocument();
  });

  it("wires aria-describedby from description onto the control", () => {
    render(
      <Field>
        <FieldLabel htmlFor="name">Map name</FieldLabel>
        <FieldControl>
          <Input id="name" />
        </FieldControl>
        <FieldDescription id="name-help">Help text</FieldDescription>
      </Field>,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      "name-help",
    );
  });

  it("renders error message and wires aria-describedby", () => {
    render(
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <FieldControl>
          <Input id="email" aria-invalid />
        </FieldControl>
        <FieldError id="email-error">Invalid email.</FieldError>
      </Field>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email.");
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      "email-error",
    );
  });

  it("renders description outside Field without wiring aria", () => {
    render(<FieldDescription>Standalone help</FieldDescription>);
    expect(screen.getByText("Standalone help")).toBeInTheDocument();
  });
});
