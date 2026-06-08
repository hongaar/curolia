import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntityLabelInput } from "./entity-label-input";

describe("entity-label-input", () => {
  it("renders without crashing", () => {
    render(
      <EntityLabelInput value={[]} onChange={() => {}} placeholder="Tags" />,
    );
    expect(document.body).toBeTruthy();
  });
});
