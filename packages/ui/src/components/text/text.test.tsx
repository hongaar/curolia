import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "./text";

describe("text", () => {
  it("renders without crashing", () => {
    render(<Text>Hello</Text>);
    expect(document.body).toBeTruthy();
  });
});
