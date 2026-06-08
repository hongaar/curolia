import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "../../lib/utils";
import { useFieldDescribedBy } from "../field/field";
import styles from "./input.module.css";

function Input({
  className,
  type,
  "aria-describedby": ariaDescribedBy,
  ...props
}: React.ComponentProps<"input">) {
  const fieldDescribedBy = useFieldDescribedBy(ariaDescribedBy);
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(styles.root, className)}
      aria-describedby={fieldDescribedBy}
      {...props}
    />
  );
}

export { Input };
