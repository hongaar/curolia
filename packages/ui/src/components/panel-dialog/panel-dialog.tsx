import { Loader2, X } from "lucide-react";
import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import styles from "./panel-dialog.module.css";

export function PanelDialogContent({
  children,
  className,
  ...props
}: ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent className={cn(styles.panelContent, className)} {...props}>
      {children}
    </DialogContent>
  );
}

/** Title row for floating panels and other non-modal shells. */
export function PanelDialogHeader({
  children,
  className,
  ...props
}: ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader className={cn(styles.panelHeader, className)} {...props}>
      {children}
    </DialogHeader>
  );
}

/** Scrollable main area; padding lives on the inner wrapper so the scrollbar is edge-flush. */
export function PanelDialogBody({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={styles.scrollBody} {...props}>
      <div className={cn(styles.scrollBodyInner, className)}>{children}</div>
    </div>
  );
}

/** Top block when not using {@link DialogHeader} (e.g. back row + title). */
export function PanelDialogSection({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={cn(styles.panelSection, className)} {...props}>
      {children}
    </div>
  );
}

export function PanelDialogFooter({
  between = false,
  className,
  children,
  ...props
}: ComponentProps<typeof DialogFooter> & {
  /** Primary actions on the right, secondary on the left (row at all breakpoints). */
  between?: boolean;
}) {
  return (
    <DialogFooter
      className={cn(
        styles.panelFooter,
        between && styles.footerBetween,
        className,
      )}
      {...props}
    >
      {children}
    </DialogFooter>
  );
}

export function PanelDialogTitle({ children }: { children: ReactNode }) {
  return <DialogTitle className={styles.panelTitle}>{children}</DialogTitle>;
}

/** Title for map-anchored / non-modal panels — must not use {@link DialogTitle}. */
export function PanelCardTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.panelTitle}>{children}</h2>;
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

/** In-form prep step (avoids stacking a second modal on pin edit). */
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
