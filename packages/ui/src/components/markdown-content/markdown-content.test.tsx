import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "./markdown-content";

describe("markdown-content", () => {
  it("renders without crashing", () => {
    render(<MarkdownContent markdown="Hello **world**" />);
    expect(document.body).toBeTruthy();
  });
});
