import type { Meta, StoryObj } from "@storybook/react";
import { useStoryArgs } from "../../storybook/args";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { WizardSteps, WizardStepsCaption } from "./wizard-steps";

const STEPS = [
  { id: "intro", label: "Overview" },
  { id: "lists", label: "Choose a list" },
  { id: "import", label: "Import" },
] as const;

type DemoArgs = {
  currentStep: number;
};

const meta = {
  title: "Wizard steps",
  ...componentStoryMeta(
    "Horizontal step indicator for multi-step flows.",
    "Pass a typed `steps` array and zero-based `currentStep`. Completed steps show a checkmark; the current step is highlighted.",
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: storyDocs("Three-step import wizard pattern."),
  args: {
    currentStep: 0,
  },
  render: function Render() {
    const [{ currentStep }, updateArgs] = useStoryArgs<DemoArgs>();

    return (
      <StoryFrame width="lg">
        <WizardStepsCaption
          currentStep={currentStep}
          totalSteps={STEPS.length}
          currentLabel={STEPS[currentStep]?.label ?? ""}
        />
        <WizardSteps
          steps={STEPS}
          currentStep={currentStep}
          aria-label="Import progress"
        />
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            type="button"
            disabled={currentStep === 0}
            onClick={() => updateArgs({ currentStep: currentStep - 1 })}
          >
            Back
          </button>
          <button
            type="button"
            disabled={currentStep >= STEPS.length - 1}
            onClick={() => updateArgs({ currentStep: currentStep + 1 })}
          >
            Next
          </button>
        </div>
      </StoryFrame>
    );
  },
};
