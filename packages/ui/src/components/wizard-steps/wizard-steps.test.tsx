import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WizardSteps } from "./wizard-steps";

describe("WizardSteps", () => {
  it("renders without crashing", () => {
    render(
      <WizardSteps
        steps={[{ id: "1", label: "Step 1" }]}
        currentStep={0}
        aria-label="Steps"
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
