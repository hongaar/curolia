import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserAvatar } from "./user-avatar";

describe("user-avatar", () => {
  it("renders without crashing", () => {
    render(<UserAvatar name="Test User" />);
    expect(document.body).toBeTruthy();
  });
});
