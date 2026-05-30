import * as React from "react";

import { cn } from "../../lib/utils";
import styles from "./caution-panel.module.css";

type CautionPanelProps = React.ComponentProps<"div"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
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

export { CautionPanel, type CautionPanelProps };
