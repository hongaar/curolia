import * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./textarea.module.css";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(styles.root, className)}
      {...props}
    />
  );
});

export { Textarea };
