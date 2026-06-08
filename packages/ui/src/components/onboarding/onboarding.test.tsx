import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent } from "../dialog";
import { OnboardingTitle } from "./onboarding";

describe("OnboardingTitle", () => {
  it("renders without crashing", () => {
    render(
      <Dialog open>
        <DialogContent>
          <OnboardingTitle>Welcome</OnboardingTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(document.body).toBeTruthy();
  });
});
