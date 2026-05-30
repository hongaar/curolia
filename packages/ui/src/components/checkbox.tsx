import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "../lib/utils";
import styles from "./checkbox.module.css";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(styles.root, className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={styles.indicator}
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
