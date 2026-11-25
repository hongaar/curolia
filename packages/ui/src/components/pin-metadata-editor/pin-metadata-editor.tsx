"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type * as React from "react";

import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";
import {
  PinPlaceMetadataIcon,
  type PinPlaceMetadataFieldKey,
} from "../pin-place-metadata/pin-place-metadata";
import styles from "./pin-metadata-editor.module.css";

export type PinMetadataEditorFieldKey = PinPlaceMetadataFieldKey;

/** Stacked list of metadata rows plus an "add" control. */
export function PinMetadataEditorRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.root}>{children}</div>;
}

export function PinMetadataEditorList({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.list}>{children}</div>;
}

export type PinMetadataEditorRowProps = {
  fieldKey: PinMetadataEditorFieldKey;
  label: React.ReactNode;
  value: React.ReactNode;
  /** Origin of the value (e.g. plugin name); omitted for manual entries. */
  source?: React.ReactNode;
  onEdit?: () => void;
  onRemove?: () => void;
  removing?: boolean;
  disabled?: boolean;
};

/** Read-only view of one metadata field with edit / remove actions. */
export function PinMetadataEditorRow({
  fieldKey,
  label,
  value,
  source,
  onEdit,
  onRemove,
  removing = false,
  disabled = false,
}: PinMetadataEditorRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.rowIcon}>
        <PinPlaceMetadataIcon fieldKey={fieldKey} />
      </span>
      <div className={styles.rowBody}>
        <div className={styles.rowLabel}>
          <span>{label}</span>
          {source ? <Badge variant="secondary">{source}</Badge> : null}
        </div>
        <div className={styles.rowValue}>{value}</div>
      </div>
      <div className={styles.rowActions}>
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            disabled={disabled || removing}
            aria-label={`Edit ${typeof label === "string" ? label : "field"}`}
          >
            <Pencil aria-hidden />
          </Button>
        ) : null}
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            disabled={disabled || removing}
            aria-label={`Remove ${typeof label === "string" ? label : "field"}`}
          >
            {removing ? (
              <Loader2 className={styles.spinIcon} aria-hidden />
            ) : (
              <Trash2 aria-hidden />
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export type PinMetadataEditorFormProps = {
  fieldKey: PinMetadataEditorFieldKey;
  label: React.ReactNode;
  children: React.ReactNode;
  onSubmit: () => void;
  onCancel: () => void;
  saving?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
};

/**
 * Inline editor card for one metadata field. Not a `<form>` so it can nest
 * inside a parent form: Enter in a single-line input submits, Escape cancels.
 */
export function PinMetadataEditorForm({
  fieldKey,
  label,
  children,
  onSubmit,
  onCancel,
  saving = false,
  submitDisabled = false,
  submitLabel = "Save",
}: PinMetadataEditorFormProps) {
  return (
    <div
      role="group"
      className={styles.form}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
          return;
        }
        if (
          e.key === "Enter" &&
          e.target instanceof HTMLInputElement &&
          !e.nativeEvent.isComposing
        ) {
          e.preventDefault();
          if (!saving && !submitDisabled) onSubmit();
        }
      }}
    >
      <div className={styles.formHeader}>
        <span className={styles.rowIcon}>
          <PinPlaceMetadataIcon fieldKey={fieldKey} />
        </span>
        <span className={styles.formTitle}>{label}</span>
      </div>
      <div className={styles.formBody}>{children}</div>
      <div className={styles.formActions}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSubmit}
          disabled={saving || submitDisabled}
        >
          {saving ? <Loader2 className={styles.spinIcon} aria-hidden /> : null}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

export type PinMetadataEditorAddGroup = {
  label: string;
  items: { fieldKey: PinMetadataEditorFieldKey; label: string }[];
};

/** "Add …" button opening a grouped menu of fields that are not set yet. */
export function PinMetadataEditorAddMenu({
  groups,
  onSelect,
  disabled = false,
  triggerLabel = "Add detail",
}: {
  groups: PinMetadataEditorAddGroup[];
  onSelect: (fieldKey: PinMetadataEditorFieldKey) => void;
  disabled?: boolean;
  triggerLabel?: string;
}) {
  const visibleGroups = groups.filter((group) => group.items.length > 0);
  if (visibleGroups.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button type="button" variant="outline" size="sm" />}
      >
        <Plus aria-hidden />
        {triggerLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {visibleGroups.map((group) => (
          <DropdownMenuGroup key={group.label}>
            <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
            {group.items.map((item) => (
              <DropdownMenuItem
                key={item.fieldKey}
                onClick={() => onSelect(item.fieldKey)}
              >
                <PinPlaceMetadataIcon fieldKey={item.fieldKey} />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Two-column layout for paired inputs inside `PinMetadataEditorForm`. */
export function PinMetadataEditorFormRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.formRow}>{children}</div>;
}
