import type * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./bullet-list.module.css";

export type BulletListProps = React.ComponentProps<"ul">;

function BulletList({ className, ...props }: BulletListProps) {
  return (
    <ul
      data-slot="bullet-list"
      className={cn(styles.list, className)}
      {...props}
    />
  );
}

export { BulletList };
