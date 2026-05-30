import type * as React from "react";

import { SelectTrigger } from "../select";
import styles from "./form-layout.module.css";

export function FormField({ children }: { children: React.ReactNode }) {
  return <div className={styles.formField}>{children}</div>;
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.formGrid}>{children}</div>;
}

export function FormGrid2({ children }: { children: React.ReactNode }) {
  return <div className={styles.formGrid2}>{children}</div>;
}

export function FormActions({
  children,
  align = "start",
}: {
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <div
      className={
        align === "end"
          ? `${styles.formActions} ${styles.formActionsEnd}`
          : styles.formActions
      }
    >
      {children}
    </div>
  );
}

export function FormSection({ children }: { children: React.ReactNode }) {
  return <div className={styles.formSection}>{children}</div>;
}

export function FormErrorText({ children }: { children: React.ReactNode }) {
  return <p className={styles.errorText}>{children}</p>;
}

export function FormMutedText({ children }: { children: React.ReactNode }) {
  return <p className={styles.mutedText}>{children}</p>;
}

export function FormMutedTextXs({ children }: { children: React.ReactNode }) {
  return <p className={styles.mutedTextXs}>{children}</p>;
}

export function SrOnlyInput(props: React.ComponentProps<"input">) {
  return <input className={styles.srOnlyInput} {...props} />;
}

export function FormSelectTriggerCompact(
  props: React.ComponentProps<typeof SelectTrigger>,
) {
  return <SelectTrigger className={styles.selectTriggerCompact} {...props} />;
}

export function FormSelectTriggerRounded(
  props: React.ComponentProps<typeof SelectTrigger>,
) {
  return <SelectTrigger className={styles.selectTriggerRounded} {...props} />;
}

export function FormSelectTriggerFull(
  props: React.ComponentProps<typeof SelectTrigger>,
) {
  return <SelectTrigger className={styles.selectTriggerFull} {...props} />;
}
