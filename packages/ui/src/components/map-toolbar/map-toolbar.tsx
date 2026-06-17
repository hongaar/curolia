import type * as React from "react";

import { cn } from "../../lib/utils";
import { DropdownMenuTrigger } from "../dropdown-menu";
import styles from "./map-toolbar.module.css";

export function MapToolbar({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}

export function MapToolbarButton({
  icon,
  label,
  active,
  onClick,
  title,
  hideOnMobile = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
  /** Hide below 40rem (e.g. zoom controls; pinch-to-zoom on mobile). */
  hideOnMobile?: boolean;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className={cn(
        styles.button,
        active && styles.buttonActive,
        hideOnMobile && styles.buttonHideOnMobile,
      )}
    >
      <span className={styles.iconCell}>{icon}</span>
      <span className={styles.labelCell}>{label}</span>
    </button>
  );
}

type MapToolbarIconButtonBaseProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  title?: string;
  badgeCount?: number;
};

type MapToolbarIconButtonAsButton = MapToolbarIconButtonBaseProps & {
  menuTrigger?: false;
  onClick?: () => void;
};

type MapToolbarIconButtonAsMenuTrigger = MapToolbarIconButtonBaseProps & {
  menuTrigger: true;
  onClick?: never;
} & Omit<
    React.ComponentProps<typeof DropdownMenuTrigger>,
    "children" | "className" | "type"
  >;

export type MapToolbarIconButtonProps =
  | MapToolbarIconButtonAsButton
  | MapToolbarIconButtonAsMenuTrigger;

function MapToolbarIconButtonContent({
  icon,
  badgeCount,
}: {
  icon: React.ReactNode;
  badgeCount?: number;
}) {
  return (
    <>
      <span className={styles.iconCell}>{icon}</span>
      {badgeCount != null && badgeCount > 0 ? (
        <span className={styles.badge} aria-hidden>
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      ) : null}
    </>
  );
}

/** Icon-only map toolbar control (action button or dropdown trigger). */
export function MapToolbarIconButton(props: MapToolbarIconButtonProps) {
  const { icon, label, active, title, badgeCount } = props;
  const className = cn(styles.iconButton, active && styles.buttonActive);

  if (props.menuTrigger) {
    const {
      menuTrigger: _menuTrigger,
      icon: _icon,
      label: _label,
      active: _active,
      title: _title,
      badgeCount: _badgeCount,
      ...triggerProps
    } = props;
    return (
      <DropdownMenuTrigger
        type="button"
        title={title ?? label}
        aria-label={label}
        className={className}
        {...triggerProps}
      >
        <MapToolbarIconButtonContent icon={icon} badgeCount={badgeCount} />
      </DropdownMenuTrigger>
    );
  }

  const { onClick } = props;
  return (
    <button
      type="button"
      title={title ?? label}
      aria-label={label}
      onClick={onClick}
      className={className}
    >
      <MapToolbarIconButtonContent icon={icon} badgeCount={badgeCount} />
    </button>
  );
}

/** @deprecated Use `MapToolbarIconButton` with `menuTrigger`. */
export function MapToolbarMenuTrigger(
  props: Omit<MapToolbarIconButtonAsMenuTrigger, "menuTrigger">,
) {
  return <MapToolbarIconButton menuTrigger {...props} />;
}
