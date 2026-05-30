import type * as React from "react";

import { DialogContent, DialogTitle } from "../components/dialog";
import { cn } from "../lib/utils";
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

export const panelDialogRoundedButtonClass = styles.roundedButton;
export const panelDialogImportButtonClass = styles.importButton;
export const panelDialogIconSmClass = styles.iconSm;
