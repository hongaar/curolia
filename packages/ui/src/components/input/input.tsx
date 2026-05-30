import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "../../lib/utils";
import styles from "./input.module.css";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(styles.root, className)}
      {...props}
    />
  );
}

export { Input };
