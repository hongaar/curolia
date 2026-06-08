import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogPageRoot } from "./blog";

describe("BlogPageRoot", () => {
  it("renders without crashing", () => {
    render(
      <BlogPageRoot>
        <div>Blog</div>
      </BlogPageRoot>,
    );
    expect(document.body).toBeTruthy();
  });
});
