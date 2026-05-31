import * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./caution-panel.module.css";

export type CautionPanelProps = React.ComponentProps<"div"> & {
  /** Warning heading shown above the description. */
  title: React.ReactNode;
  /** Optional supporting copy; omitted when not set. */
  description?: React.ReactNode;
  /** Primary action row (e.g. destructive button). */
  children?: React.ReactNode;
};

function CautionPanel({
  className,
  title,
  description,
  children,
  ...props
}: CautionPanelProps) {
  return (
    <div
      data-slot="caution-panel"
      className={cn(styles.root, className)}
      {...props}
    >
      <h3 className={styles.title}>{title}</h3>
      {description ? (
        <div className={styles.description}>{description}</div>
      ) : null}
      {children ? <div className={styles.children}>{children}</div> : null}
    </div>
  );
}

export { CautionPanel };
