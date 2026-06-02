import { X } from "lucide-react";
import type * as React from "react";

import {
  FormErrorText,
  FormField,
  FormGrid,
  FormGrid2,
  FormMutedText,
  FormMutedTextXs,
  FormSelectTriggerFull,
  SrOnlyInput,
} from "../form-layout";
import {
  PanelDialogBody,
  PanelDialogContent,
  PanelDialogFooter,
  PanelDialogHeader,
  PanelDialogTitle,
} from "../panel-dialog";
import styles from "./pin-form.module.css";

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

/** Map-anchored floating panel. Same header / body / footer layout as {@link PinFormPanelDialog}. */
export function PinFormPanelCard({
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
    <div className={styles.panelCard}>
      <PanelDialogHeader>
        <PanelDialogTitle>{title}</PanelDialogTitle>
      </PanelDialogHeader>
      <PanelDialogBody>{children}</PanelDialogBody>
      <PanelDialogFooter between={footerBetween}>{footer}</PanelDialogFooter>
    </div>
  );
}

/** Pin create/edit in a modal — same shell as other {@link PanelDialogContent} dialogs. */
export function PinFormPanelDialog({
  title,
  children,
  footer,
  footerBetween = false,
  ...contentProps
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  footerBetween?: boolean;
} & Omit<React.ComponentProps<typeof PanelDialogContent>, "children">) {
  return (
    <PanelDialogContent {...contentProps}>
      <PanelDialogHeader>
        <PanelDialogTitle>{title}</PanelDialogTitle>
      </PanelDialogHeader>
      <PanelDialogBody>{children}</PanelDialogBody>
      <PanelDialogFooter between={footerBetween}>{footer}</PanelDialogFooter>
    </PanelDialogContent>
  );
}

export function PinFormPanelFieldGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.panelCardFieldGroup}>{children}</div>;
}

export function PinFormGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.formGrid}>{children}</div>;
}

export function PinFormCoordsGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.coordsGrid}>{children}</div>;
}

export function PinFormPlaceText({
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

export function PinFormPhotoGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.photoGrid}>{children}</div>;
}

export function PinFormPhotoThumb({
  children,
  removeButton,
}: {
  children: React.ReactNode;
  removeButton?: React.ReactNode;
}) {
  return (
    <div className={styles.photoThumb}>
      {children}
      {removeButton}
    </div>
  );
}

export function PinFormPhotoRemoveButton({
  onClick,
  disabled,
  ariaLabel = "Remove photo",
}: {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className={styles.photoRemove}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      title="Remove photo"
    >
      <X className={styles.photoRemoveIcon} aria-hidden />
    </button>
  );
}

export function PinFormPhotoPlaceholder({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.photoPlaceholder}>{children}</div>;
}

export function PinFormUploadRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.uploadRow}>{children}</div>;
}

export function PinFormUploadLabel({
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

export function PinFormUploadInput(props: React.ComponentProps<"input">) {
  return <input className={styles.uploadInput} {...props} />;
}

export function PinFormTagBox({ children }: { children: React.ReactNode }) {
  return <div className={styles.tagBox}>{children}</div>;
}

export function PinFormTagOption({
  children,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label className={styles.tagOption} {...props}>
      {children}
    </label>
  );
}

export function PinFormDangerZone({ children }: { children: React.ReactNode }) {
  return <div className={styles.dangerZone}>{children}</div>;
}

export function PinFormDangerActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.dangerActions}>{children}</div>;
}

export function PinFormDangerHint({ children }: { children: React.ReactNode }) {
  return <p className={styles.dangerHint}>{children}</p>;
}

export function PinFormMoveList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.moveList}>{children}</ul>;
}

export function PinFormDialogFooter({
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

export function PinFormFloatingHost({
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

export function PinFormFooterSplit({
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

export const pinFormStyles = styles;
