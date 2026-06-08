import { GripVertical, X } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { cn } from "../../lib/utils";
import styles from "./photo-grid.module.css";

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return items;
  next.splice(toIndex, 0, moved);
  return next;
}

export type PhotoGridSortableRenderContext = {
  isDragging: boolean;
  isDropTarget: boolean;
  dragHandle: React.ReactNode;
};

type PhotoGridStaticProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
  items?: never;
  getItemId?: never;
  onReorder?: never;
  disabled?: never;
  sortable?: never;
  renderItem?: never;
};

type PhotoGridSortableProps<T> = Omit<
  React.ComponentProps<"div">,
  "children"
> & {
  items: T[];
  getItemId: (item: T) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, ctx: PhotoGridSortableRenderContext) => React.ReactNode;
  sortable?: boolean;
  disabled?: boolean;
  children?: never;
};

function isSortableProps<T>(
  props: PhotoGridStaticProps | PhotoGridSortableProps<T>,
): props is PhotoGridSortableProps<T> {
  return (
    props.items !== undefined &&
    props.getItemId !== undefined &&
    props.onReorder !== undefined &&
    props.renderItem !== undefined
  );
}

export function PhotoGrid<T>(
  props: PhotoGridStaticProps | PhotoGridSortableProps<T>,
) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (isSortableProps(props)) {
    const {
      className,
      items,
      getItemId,
      onReorder,
      disabled = false,
      sortable,
      renderItem,
      ...rest
    } = props;
    const canSort = sortable ?? (items.length > 1 && !disabled);

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
      <div
        data-slot="photo-grid"
        className={cn(styles.grid, className)}
        {...rest}
      >
        {items.map((item, index) => {
          const isDragging = dragIndex === index;
          const isDropTarget = overIndex === index && dragIndex !== index;
          const dragHandle = canSort ? (
            <button
              type="button"
              className={styles.dragHandle}
              draggable
              disabled={disabled}
              aria-label="Drag to reorder"
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
              <GripVertical className={styles.dragHandleIcon} aria-hidden />
            </button>
          ) : null;

          return (
            <div
              key={getItemId(item)}
              className={cn(
                styles.sortableItem,
                isDragging && styles.sortableItemDragging,
                isDropTarget && styles.sortableItemOver,
              )}
              onDragOver={
                canSort
                  ? (e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setOverIndex(index);
                    }
                  : undefined
              }
              onDrop={
                canSort
                  ? (e) => {
                      e.preventDefault();
                      finishDrag(index);
                    }
                  : undefined
              }
              onDragLeave={
                canSort
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
      </div>
    );
  }

  const { className, children, ...rest } = props;
  return (
    <div
      data-slot="photo-grid"
      className={cn(styles.grid, className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PhotoGridThumb({
  children,
  removeButton,
  dragHandle,
  className,
}: {
  children: React.ReactNode;
  removeButton?: React.ReactNode;
  dragHandle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(styles.thumb, className)}>
      {dragHandle}
      {children}
      {removeButton}
    </div>
  );
}

export function PhotoGridRemoveButton({
  onClick,
  disabled,
  ariaLabel = "Remove photo",
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(styles.removeButton, className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      title="Remove photo"
    >
      <X className={styles.removeButtonIcon} aria-hidden />
    </button>
  );
}

export function PhotoGridPlaceholder({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(styles.placeholder, className)}>{children}</div>;
}
