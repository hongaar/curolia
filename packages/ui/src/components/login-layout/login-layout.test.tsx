import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginLayout } from "./login-layout";

describe("login-layout", () => {
  it("renders without crashing", () => {
    render(
      <LoginLayout title="Sign in">
        <div>Form</div>
      </LoginLayout>,
    );
    expect(document.body).toBeTruthy();
  });
});
