import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Field } from "../field";
import { FormSection } from "./form-layout";

describe("FormSection", () => {
  it("renders children", () => {
    render(
      <FormSection>
        <Field>
          <span>Field</span>
        </Field>
      </FormSection>,
    );
    expect(screen.getByText("Field")).toBeInTheDocument();
  });
});
