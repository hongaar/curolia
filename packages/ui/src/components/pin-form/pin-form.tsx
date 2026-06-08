import { GripVertical, X } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../card";
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

export function PinFormPhotoGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.photoGrid}>{children}</div>;
}

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return items;
  next.splice(toIndex, 0, moved);
  return next;
}

export type PinFormPhotoSortableRenderContext = {
  isDragging: boolean;
  isDropTarget: boolean;
  dragHandle: React.ReactNode;
};

export function PinFormPhotoSortableGrid<T>({
  items,
  getItemId,
  onReorder,
  disabled = false,
  renderItem,
}: {
  items: T[];
  getItemId: (item: T) => string;
  onReorder: (items: T[]) => void;
  disabled?: boolean;
  renderItem: (
    item: T,
    ctx: PinFormPhotoSortableRenderContext,
  ) => React.ReactNode;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const sortable = items.length > 1 && !disabled;

  function finishDrag(targetIndex: number | null) {
    if (
      dragIndex !== null &&
      targetIndex !== null &&
      dragIndex !== targetIndex
    ) {
      onReorder(reorderItems(items, dragIndex, targetIndex));
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <PinFormPhotoGrid>
      {items.map((item, index) => {
        const isDragging = dragIndex === index;
        const isDropTarget = overIndex === index && dragIndex !== index;
        const dragHandle = sortable ? (
          <button
            type="button"
            className={styles.photoDragHandle}
            draggable
            disabled={disabled}
            aria-label="Drag to reorder photo"
            title="Drag to reorder"
            onDragStart={(e) => {
              setDragIndex(index);
              setOverIndex(index);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", getItemId(item));
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
          >
            <GripVertical className={styles.photoDragHandleIcon} aria-hidden />
          </button>
        ) : null;

        return (
          <div
            key={getItemId(item)}
            className={[
              styles.photoSortableItem,
              isDragging ? styles.photoSortableItemDragging : "",
              isDropTarget ? styles.photoSortableItemOver : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onDragOver={
              sortable
                ? (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setOverIndex(index);
                  }
                : undefined
            }
            onDrop={
              sortable
                ? (e) => {
                    e.preventDefault();
                    finishDrag(index);
                  }
                : undefined
            }
            onDragLeave={
              sortable
                ? () => {
                    setOverIndex((prev) => (prev === index ? null : prev));
                  }
                : undefined
            }
          >
            {renderItem(item, { isDragging, isDropTarget, dragHandle })}
          </div>
        );
      })}
    </PinFormPhotoGrid>
  );
}

export function PinFormPhotoThumb({
  children,
  removeButton,
  dragHandle,
}: {
  children: React.ReactNode;
  removeButton?: React.ReactNode;
  dragHandle?: React.ReactNode;
}) {
  return (
    <div className={styles.photoThumb}>
      {dragHandle}
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

export const pinFormStyles = styles;
