import type * as React from "react";
import { createContext, useContext, useId, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Checkbox } from "../checkbox";
import styles from "./list.module.css";

export function BorderedList({
  children,
  flush = false,
}: {
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <ul className={flush ? styles.borderedListFlush : styles.borderedList}>
      {children}
    </ul>
  );
}

export function ListEmptyItem({ children }: { children: React.ReactNode }) {
  return <li className={styles.listEmpty}>{children}</li>;
}

export function NotificationListButton({
  unread,
  onClick,
  title,
  body,
  meta,
}: {
  unread: boolean;
  onClick: () => void;
  title: React.ReactNode;
  body?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <li className={unread ? styles.listItemUnread : undefined}>
      <button type="button" className={styles.listButton} onClick={onClick}>
        {unread ? (
          <span className={styles.unreadDot} aria-hidden />
        ) : (
          <span className={styles.unreadSpacer} aria-hidden />
        )}
        <span className={styles.listButtonBody}>
          <span className={styles.listButtonTitle}>{title}</span>
          {body ? (
            <span className={styles.listButtonSubtitle}>{body}</span>
          ) : null}
          {meta ? <span className={styles.listButtonMeta}>{meta}</span> : null}
        </span>
      </button>
    </li>
  );
}

export function MemberListRow({ children }: { children: React.ReactNode }) {
  return <li className={styles.memberRow}>{children}</li>;
}

export function MemberAvatar({ children }: { children: React.ReactNode }) {
  return <span className={styles.memberAvatar}>{children}</span>;
}

export function MemberPrimary({
  children,
  secondary,
}: {
  children: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <span className={styles.memberPrimary}>
      {children}
      {secondary ? (
        <span className={styles.memberSecondary}>{secondary}</span>
      ) : null}
    </span>
  );
}

export function MemberRole({ children }: { children: React.ReactNode }) {
  return <span className={styles.memberRole}>{children}</span>;
}

export function MemberActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.memberActions}>{children}</div>;
}

type SelectListContextValue<T extends string> = {
  name: string;
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
};

const SelectListContext = createContext<SelectListContextValue<string> | null>(
  null,
);

function useSelectListContext<T extends string>() {
  const ctx = useContext(SelectListContext);
  if (!ctx) {
    throw new Error("SelectListOption must be used within SelectList");
  }
  return ctx as unknown as SelectListContextValue<T>;
}

export function SelectList<T extends string>({
  name,
  value,
  onValueChange,
  disabled = false,
  "aria-labelledby": ariaLabelledBy,
  flush = false,
  children,
}: {
  name: string;
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  "aria-labelledby"?: string;
  flush?: boolean;
  children: ReactNode;
}) {
  const fallbackLabelId = useId();
  const labelledBy = ariaLabelledBy ?? fallbackLabelId;

  return (
    <SelectListContext.Provider
      value={{
        name,
        value,
        onValueChange: onValueChange as (value: string) => void,
        disabled,
      }}
    >
      {!ariaLabelledBy ? (
        <span id={fallbackLabelId} className={styles.srOnly}>
          List selection
        </span>
      ) : null}
      <ul
        role="radiogroup"
        aria-labelledby={labelledBy}
        className={cn(
          flush ? styles.borderedListFlush : styles.borderedList,
          styles.selectList,
        )}
      >
        {children}
      </ul>
    </SelectListContext.Provider>
  );
}

type CheckListContextValue<T extends string> = {
  selected: ReadonlySet<T>;
  onToggle: (value: T, checked: boolean) => void;
  disabled?: boolean;
};

const CheckListContext = createContext<CheckListContextValue<string> | null>(
  null,
);

function useCheckListContext<T extends string>() {
  const ctx = useContext(CheckListContext);
  if (!ctx) {
    throw new Error("CheckListOption must be used within CheckList");
  }
  return ctx as unknown as CheckListContextValue<T>;
}

export function CheckList<T extends string>({
  selected,
  onToggle,
  disabled = false,
  "aria-labelledby": ariaLabelledBy,
  flush = false,
  children,
}: {
  selected: ReadonlySet<T>;
  onToggle: (value: T, checked: boolean) => void;
  disabled?: boolean;
  "aria-labelledby"?: string;
  flush?: boolean;
  children: ReactNode;
}) {
  const fallbackLabelId = useId();
  const labelledBy = ariaLabelledBy ?? fallbackLabelId;

  return (
    <CheckListContext.Provider
      value={{
        selected: selected as ReadonlySet<string>,
        onToggle: onToggle as (value: string, checked: boolean) => void,
        disabled,
      }}
    >
      {!ariaLabelledBy ? (
        <span id={fallbackLabelId} className={styles.srOnly}>
          List selection
        </span>
      ) : null}
      <ul
        role="group"
        aria-labelledby={labelledBy}
        className={cn(
          flush ? styles.borderedListFlush : styles.borderedList,
          styles.selectList,
        )}
      >
        {children}
      </ul>
    </CheckListContext.Provider>
  );
}

export function CheckListOption<T extends string>({
  value,
  label,
  description,
  meta,
  icon,
}: {
  value: T;
  label: string;
  description?: string;
  meta?: ReactNode;
  icon?: ReactNode;
}) {
  const { selected, onToggle, disabled } = useCheckListContext<T>();
  const checked = selected.has(value);

  return (
    <li
      className={cn(
        styles.selectListItem,
        checked && styles.selectListItemSelected,
      )}
    >
      <label className={styles.selectListLabel}>
        <Checkbox
          checked={checked}
          disabled={disabled}
          onCheckedChange={(next) => onToggle(value, next === true)}
        />
        {icon ? <span className={styles.selectListIcon}>{icon}</span> : null}
        <span className={styles.selectListBody}>
          <span className={styles.selectListTitle}>{label}</span>
          {description ? (
            <span className={styles.selectListDescription}>{description}</span>
          ) : null}
        </span>
        {meta ? <span className={styles.selectListMeta}>{meta}</span> : null}
      </label>
    </li>
  );
}

export function SelectListOption<T extends string>({
  value,
  label,
  description,
  meta,
  icon,
}: {
  value: T;
  label: string;
  description?: string;
  meta?: ReactNode;
  icon?: ReactNode;
}) {
  const {
    name,
    value: selectedValue,
    onValueChange,
    disabled,
  } = useSelectListContext<T>();
  const selected = selectedValue === value;
  const inputId = `${name}-${value}`;

  return (
    <li
      className={cn(
        styles.selectListItem,
        selected && styles.selectListItemSelected,
      )}
    >
      <label htmlFor={inputId} className={styles.selectListLabel}>
        <input
          id={inputId}
          className={styles.selectListInput}
          type="radio"
          name={name}
          value={value}
          checked={selected}
          disabled={disabled}
          onChange={() => onValueChange(value)}
        />
        {icon ? <span className={styles.selectListIcon}>{icon}</span> : null}
        <span className={styles.selectListBody}>
          <span className={styles.selectListTitle}>{label}</span>
          {description ? (
            <span className={styles.selectListDescription}>{description}</span>
          ) : null}
        </span>
        {meta ? <span className={styles.selectListMeta}>{meta}</span> : null}
      </label>
    </li>
  );
}
