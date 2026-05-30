import { Loader2 } from "lucide-react";
import type * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import { DialogContent, DialogTitle } from "../dialog";
import styles from "./panel-dialog.module.css";

export function PanelDialogContent({
  children,
  size = "default",
  ...props
}: React.ComponentProps<typeof DialogContent> & {
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

export function PanelDialogTitle({ children }: { children: React.ReactNode }) {
  return <DialogTitle className={styles.panelTitle}>{children}</DialogTitle>;
}

export function PanelDialogFormStack({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.formStack}>{children}</div>;
}

export function PanelDialogField({ children }: { children: React.ReactNode }) {
  return <div className={styles.formField}>{children}</div>;
}

export function PanelDialogMonoBox({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.monoBox}>{children}</div>;
}

export function PanelDialogFooterRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.footerRow}>{children}</div>;
}

export function PanelDialogRoundedButton({
  size = "sm",
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
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
}: React.ComponentProps<typeof Button>) {
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
