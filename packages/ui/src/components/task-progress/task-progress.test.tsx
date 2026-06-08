import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskProgress } from "./task-progress";

describe("TaskProgress", () => {
  it("renders without crashing", () => {
    render(<TaskProgress />);
    expect(document.body).toBeTruthy();
  });
});
