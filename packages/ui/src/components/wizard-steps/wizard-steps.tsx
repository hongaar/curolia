import { Check } from "lucide-react";

import { cn } from "../../lib/utils";
import styles from "./wizard-steps.module.css";

export type WizardStepItem = {
  id: string;
  label: string;
};

type StepStatus = "complete" | "current" | "upcoming";

function stepStatus(index: number, currentStep: number): StepStatus {
  if (index < currentStep) return "complete";
  if (index === currentStep) return "current";
  return "upcoming";
}

export function WizardSteps({
  steps,
  currentStep,
  "aria-label": ariaLabel,
}: {
  steps: readonly WizardStepItem[];
  /** Zero-based index of the active step. */
  currentStep: number;
  "aria-label": string;
}) {
  const safeCurrent = Math.min(
    Math.max(currentStep, 0),
    Math.max(steps.length - 1, 0),
  );

  return (
    <ol className={styles.wizardSteps} aria-label={ariaLabel}>
      {steps.map((step, index) => {
        const status = stepStatus(index, safeCurrent);
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.id}
            className={styles.step}
            aria-current={status === "current" ? "step" : undefined}
          >
            <div className={styles.track} aria-hidden>
              <span
                className={cn(
                  styles.connector,
                  !isFirst && status !== "upcoming" && styles.connectorComplete,
                  isFirst && styles.connectorHidden,
                )}
              />
              <span
                className={cn(
                  styles.marker,
                  status === "complete" && styles.markerComplete,
                  status === "current" && styles.markerCurrent,
                  status === "upcoming" && styles.markerUpcoming,
                )}
              >
                {status === "complete" ? (
                  <Check className={styles.checkIcon} strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  styles.connector,
                  !isLast && index < safeCurrent && styles.connectorComplete,
                  isLast && styles.connectorHidden,
                )}
              />
            </div>
            <span
              className={cn(
                styles.label,
                status === "complete" && styles.labelComplete,
                status === "current" && styles.labelCurrent,
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function WizardStepsCaption({
  currentStep,
  totalSteps,
  currentLabel,
}: {
  currentStep: number;
  totalSteps: number;
  currentLabel: string;
}) {
  return (
    <p className={styles.srOnly}>
      Step {currentStep + 1} of {totalSteps}: {currentLabel}
    </p>
  );
}
