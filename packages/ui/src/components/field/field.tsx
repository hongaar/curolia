import * as React from "react";

import { cn } from "../../lib/utils";
import { Label } from "../label";
import styles from "./field.module.css";

type FieldContextValue = {
  descriptionId: string | null;
  errorId: string | null;
  setDescriptionId: (id: string | null) => void;
  setErrorId: (id: string | null) => void;
};

const FieldContext = React.createContext<FieldContextValue | null>(null);
const FieldDescribedByContext = React.createContext<string | undefined>(
  undefined,
);

function useOptionalFieldContext() {
  return React.useContext(FieldContext);
}

function mergeDescribedBy(
  ...values: Array<string | null | undefined>
): string | undefined {
  const merged = values.filter(Boolean).join(" ");
  return merged || undefined;
}

/** Merges field help/error ids onto form controls (Input, SelectTrigger, etc.). */
export function useFieldDescribedBy(describedBy?: string): string | undefined {
  const fromField = React.useContext(FieldDescribedByContext);
  return mergeDescribedBy(fromField, describedBy);
}

function Field({ className, ...props }: React.ComponentProps<"div">) {
  const [descriptionId, setDescriptionId] = React.useState<string | null>(null);
  const [errorId, setErrorId] = React.useState<string | null>(null);

  const value = React.useMemo(
    () => ({
      descriptionId,
      errorId,
      setDescriptionId,
      setErrorId,
    }),
    [descriptionId, errorId],
  );

  return (
    <FieldContext.Provider value={value}>
      <div
        data-slot="field"
        className={cn(styles.root, className)}
        {...props}
      />
    </FieldContext.Provider>
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(styles.label, className)}
      {...props}
    />
  );
}

function FieldControl({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const ctx = useOptionalFieldContext();
  const describedBy = ctx
    ? mergeDescribedBy(ctx.descriptionId, ctx.errorId)
    : undefined;

  return (
    <FieldDescribedByContext.Provider value={describedBy}>
      <div
        data-slot="field-control"
        className={cn(styles.control, className)}
        {...props}
      >
        {children}
      </div>
    </FieldDescribedByContext.Provider>
  );
}

function FieldDescription({
  className,
  id,
  variant = "caption",
  ...props
}: React.ComponentProps<"p"> & {
  variant?: "caption" | "body";
}) {
  const ctx = useOptionalFieldContext();
  const generatedId = React.useId();
  const resolvedId = id ?? generatedId;

  React.useEffect(() => {
    if (!ctx) return;
    ctx.setDescriptionId(resolvedId);
    return () => ctx.setDescriptionId(null);
  }, [resolvedId, ctx]);

  return (
    <p
      data-slot="field-description"
      id={resolvedId}
      className={cn(
        variant === "body" ? styles.descriptionBody : styles.description,
        className,
      )}
      {...props}
    />
  );
}

function FieldError({ className, id, ...props }: React.ComponentProps<"p">) {
  const ctx = useOptionalFieldContext();
  const generatedId = React.useId();
  const resolvedId = id ?? generatedId;

  React.useEffect(() => {
    if (!ctx) return;
    ctx.setErrorId(resolvedId);
    return () => ctx.setErrorId(null);
  }, [resolvedId, ctx]);

  return (
    <p
      data-slot="field-error"
      id={resolvedId}
      role="alert"
      className={cn(styles.error, className)}
      {...props}
    />
  );
}

export { Field, FieldControl, FieldDescription, FieldError, FieldLabel };
