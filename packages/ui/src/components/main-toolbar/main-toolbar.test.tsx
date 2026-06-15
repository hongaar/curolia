import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MainToolbar } from "./main-toolbar";

describe("MainToolbar", () => {
  it("renders without crashing", () => {
    render(
      <MainToolbar
        accountMenu={<span>Account</span>}
        notifications={<span>Notifications</span>}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
