import * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./textarea.module.css";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(styles.root, className)}
      {...props}
    />
  );
}

export { Textarea };
