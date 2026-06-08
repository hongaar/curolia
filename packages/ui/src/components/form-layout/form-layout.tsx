import type * as React from "react";

import { SelectTrigger } from "../select";
import styles from "./form-layout.module.css";

export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  useFieldDescribedBy,
} from "../field";

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

export function FormSelectTriggerInvite(
  props: React.ComponentProps<typeof SelectTrigger>,
) {
  return <SelectTrigger className={styles.selectTriggerInvite} {...props} />;
}

export function FormSelectTriggerFull(
  props: React.ComponentProps<typeof SelectTrigger>,
) {
  return <SelectTrigger className={styles.selectTriggerFull} {...props} />;
}
