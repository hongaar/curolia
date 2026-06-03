import { X } from "lucide-react";
import type * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../card";
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
  PanelCardTitle,
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
        <PanelCardTitle>{title}</PanelCardTitle>
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
  size = "default",
  ...contentProps
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  footerBetween?: boolean;
  size?: React.ComponentProps<typeof PanelDialogContent>["size"];
} & Omit<
  React.ComponentProps<typeof PanelDialogContent>,
  "children" | "size"
>) {
  return (
    <PanelDialogContent size={size} {...contentProps}>
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

export function PinFormGrid({
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={styles.formGrid} {...props}>
      {children}
    </div>
  );
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

/** Pin editor card for a plugin form section (icon + title from shell; body from plugin). */
export function PinFormPluginSectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  if (children == null || children === false) return null;

  return (
    <Card className={styles.pluginSectionCard}>
      <CardHeader className={styles.pluginSectionHeader}>
        <div className={styles.pluginSectionTitleRow}>
          <span className={styles.pluginSectionIcon}>{icon}</span>
          <CardTitle className={styles.pluginSectionTitle}>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className={styles.pluginSectionBody}>{children}</CardContent>
    </Card>
  );
}

export const pinFormStyles = styles;
