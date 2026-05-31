import { Loader2, X } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import { DialogContent, DialogTitle } from "../dialog";
import styles from "./panel-dialog.module.css";

export function PanelDialogContent({
  children,
  size = "default",
  ...props
}: ComponentProps<typeof DialogContent> & {
  size?: "default" | "md";
}) {
  return (
    <DialogContent
      className={cn(
        styles.panelContent,
        size === "md" && styles.contentMd,
        props.className,
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

export function PanelDialogTitle({ children }: { children: ReactNode }) {
  return <DialogTitle className={styles.panelTitle}>{children}</DialogTitle>;
}

export function PanelDialogFormStack({ children }: { children: ReactNode }) {
  return <div className={styles.formStack}>{children}</div>;
}

export function PanelDialogField({ children }: { children: ReactNode }) {
  return <div className={styles.formField}>{children}</div>;
}

export function PanelDialogMonoBox({ children }: { children: ReactNode }) {
  return <div className={styles.monoBox}>{children}</div>;
}

export function PanelDialogFooterRow({ children }: { children: ReactNode }) {
  return <div className={styles.footerRow}>{children}</div>;
}

export function PanelDialogRoundedButton({
  size = "sm",
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      size={size}
      className={cn(styles.roundedButton, className)}
      {...props}
    />
  );
}

export function PanelDialogImportButton({
  variant = "outline",
  size = "sm",
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(styles.importButton, className)}
      {...props}
    />
  );
}

export function PanelDialogSpinner() {
  return <Loader2 className={cn(styles.iconSm, "spin")} aria-hidden />;
}

/** In-form prep step (avoids stacking a second modal on trace edit). */
export function PanelDialogInlinePrep({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <div className={styles.inlinePrep} role="group" aria-labelledby={titleId}>
      <div className={styles.inlinePrepHeader}>
        <h3 id={titleId} className={styles.inlinePrepTitle}>
          {title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={styles.inlinePrepClose}
          aria-label="Close"
          onClick={onClose}
        >
          <X className={styles.iconSm} aria-hidden />
        </Button>
      </div>
      {description ? (
        <p className={styles.inlinePrepDescription}>{description}</p>
      ) : null}
      <div className={styles.inlinePrepBody}>{children}</div>
    </div>
  );
}
