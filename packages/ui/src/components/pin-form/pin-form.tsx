import type * as React from "react";

import { BulletList } from "../bullet-list";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import {
  FileUploadInput,
  FileUploadLabel,
  FileUploadRow,
} from "../file-upload";
import { OptionList, OptionListItem } from "../option-list";
import {
  PhotoGrid,
  PhotoGridPlaceholder,
  PhotoGridRemoveButton,
  PhotoGridThumb,
  type PhotoGridSortableRenderContext,
} from "../photo-grid";
import styles from "./pin-form.module.css";

export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FormGrid,
  FormGrid2,
  FormSelectTriggerFull,
  SrOnlyInput,
} from "../form-layout";

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

/** @deprecated Use `PhotoGrid` from `@curolia/ui/photo-grid`. */
export const PinFormPhotoGrid = PhotoGrid;

/** @deprecated Use `PhotoGrid` with `items` from `@curolia/ui/photo-grid`. */
export const PinFormPhotoSortableGrid = PhotoGrid;

/** @deprecated Use `PhotoGridSortableRenderContext` from `@curolia/ui/photo-grid`. */
export type PinFormPhotoSortableRenderContext = PhotoGridSortableRenderContext;

/** @deprecated Use `PhotoGridThumb` from `@curolia/ui/photo-grid`. */
export const PinFormPhotoThumb = PhotoGridThumb;

/** @deprecated Use `PhotoGridRemoveButton` from `@curolia/ui/photo-grid`. */
export const PinFormPhotoRemoveButton = PhotoGridRemoveButton;

/** @deprecated Use `PhotoGridPlaceholder` from `@curolia/ui/photo-grid`. */
export const PinFormPhotoPlaceholder = PhotoGridPlaceholder;

/** @deprecated Use `FileUploadRow` from `@curolia/ui/file-upload`. */
export const PinFormUploadRow = FileUploadRow;

/** @deprecated Use `FileUploadLabel` from `@curolia/ui/file-upload`. */
export const PinFormUploadLabel = FileUploadLabel;

/** @deprecated Use `FileUploadInput` from `@curolia/ui/file-upload`. */
export const PinFormUploadInput = FileUploadInput;

/** @deprecated Use `OptionList` from `@curolia/ui/option-list`. */
export const PinFormTagBox = OptionList;

/** @deprecated Use `OptionListItem` from `@curolia/ui/option-list`. */
export const PinFormTagOption = OptionListItem;

/** @deprecated Use `BulletList` from `@curolia/ui/bullet-list`. */
export const PinFormMoveList = BulletList;

export function PinFormFloatingHost({
  hostRef,
  children,
}: {
  hostRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div ref={hostRef} className={styles.floatingHost}>
      <div className={styles.floatingInner}>{children}</div>
    </div>
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
    <Card size="sm" className={styles.pluginSectionCard}>
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
