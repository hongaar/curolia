import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./option-list.module.css";

export function OptionList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="option-list"
      className={cn(styles.root, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function OptionListItem({
  className,
  children,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label className={cn(styles.item, className)} {...props}>
      {children}
    </label>
  );
}
