import type * as React from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/card";
import { DialogContent } from "../components/dialog";
import { cn } from "../lib/utils";
import {
  FormErrorText,
  FormField,
  FormGrid,
  FormGrid2,
  FormMutedText,
  FormMutedTextXs,
  FormSelectTriggerFull,
  SrOnlyInput,
} from "./form-layout";
import styles from "./trace-form-ui.module.css";

export {
  FormErrorText,
  FormField,
  FormGrid,
  FormGrid2,
  FormMutedText,
  FormMutedTextXs,
  FormSelectTriggerFull,
  SrOnlyInput,
};

export function TraceFormPanelCard({
  title,
  children,
  footer,
  footerBetween = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  footerBetween?: boolean;
}) {
  return (
    <Card className={styles.panelCard}>
      <CardHeader className={styles.panelCardHeader}>
        <CardTitle className={styles.panelCardTitle}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={styles.panelCardContent}>{children}</CardContent>
      <CardFooter
        className={
          footerBetween
            ? `${styles.panelCardFooter} ${styles.panelCardFooterBetween}`
            : styles.panelCardFooter
        }
      >
        {footer}
      </CardFooter>
    </Card>
  );
}

export function TraceFormGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.formGrid}>{children}</div>;
}

export function TraceFormCoordsGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.coordsGrid}>{children}</div>;
}

export function TraceFormPlaceText({
  pending,
  children,
}: {
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      className={
        pending
          ? `${styles.placeText} ${styles.placePending}`
          : styles.placeText
      }
    >
      {children}
    </p>
  );
}

export function TraceFormPhotoGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.photoGrid}>{children}</div>;
}

export function TraceFormPhotoThumb({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.photoThumb}>{children}</div>;
}

export function TraceFormPhotoPlaceholder({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.photoPlaceholder}>{children}</div>;
}

export function TraceFormUploadRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.uploadRow}>{children}</div>;
}

export function TraceFormUploadLabel({
  children,
  input,
}: {
  children: React.ReactNode;
  input: React.ReactNode;
}) {
  return (
    <label className={styles.uploadLabel}>
      {children}
      {input}
    </label>
  );
}

export function TraceFormUploadInput(props: React.ComponentProps<"input">) {
  return <input className={styles.uploadInput} {...props} />;
}

export function TraceFormTagBox({ children }: { children: React.ReactNode }) {
  return <div className={styles.tagBox}>{children}</div>;
}

export function TraceFormTagOption({
  children,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label className={styles.tagOption} {...props}>
      {children}
    </label>
  );
}

export function TraceFormDangerZone({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.dangerZone}>{children}</div>;
}

export function TraceFormDangerActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.dangerActions}>{children}</div>;
}

export function TraceFormDangerHint({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.dangerHint}>{children}</p>;
}

export function TraceFormMoveList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.moveList}>{children}</ul>;
}

export function TraceFormDialogFooter({
  children,
  bordered = false,
}: {
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <div
      className={
        bordered
          ? `${styles.dialogFooterBorder} ${styles.dialogFooterBorderTop}`
          : styles.dialogFooterBorder
      }
    >
      {children}
    </div>
  );
}

export function TraceFormFloatingHost({
  hostRef,
  children,
}: {
  hostRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div ref={hostRef} className={styles.floatingHost}>
      <div className={styles.floatingInner}>
        <div className={styles.floatingShell}>{children}</div>
      </div>
    </div>
  );
}

export function TraceFormModalContent({
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(styles.modalContent, props.className)}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

export function TraceFormFooterSplit({
  start,
  end,
}: {
  start: React.ReactNode;
  end: React.ReactNode;
}) {
  return (
    <>
      {start}
      <div className={styles.footerSplitEnd}>{end}</div>
    </>
  );
}

export const traceFormStyles = styles;
