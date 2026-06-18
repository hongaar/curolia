import type * as React from "react";

import styles from "./main-toolbar.module.css";

export type MainToolbarProps = {
  /** Map selector control (e.g. dropdown trigger). */
  mapPicker?: React.ReactNode;
  /** Search slot beside map picker (hidden on small viewports via CSS). */
  search?: React.ReactNode;
  /** Current-page nav label after the brand (e.g. Discover on the discover page). Always visible. */
  navCurrent?: React.ReactNode;
  /** Promo nav control after the brand (e.g. Discover for signed-out users). Hidden below 40rem. */
  leftPromo?: React.ReactNode;
  /** Promo nav control before notifications (e.g. Discover for signed-in users). Hidden below 40rem. */
  rightPromo?: React.ReactNode;
  /** Notifications control shown left of the account menu. */
  notifications?: React.ReactNode;
  accountMenu: React.ReactNode;
  /** App icon URL (defaults to `/favicon.png`). */
  logoSrc?: string;
  /** Brand wordmark beside the icon. */
  brandLabel?: string;
  /** Brand block (e.g. client router `Link` wrapping `MainToolbarBrand`). */
  brand?: React.ReactNode;
};

export function MainToolbarBrand({
  logoSrc = "/favicon.png",
  label = "Curolia",
  /** Mobile map overlay: fixed light/dark wordmark over the basemap (ignores app theme). */
  overlayNameTone,
}: {
  logoSrc?: string;
  label?: string;
  overlayNameTone?: "light" | "dark";
}) {
  const brandNameClassName =
    overlayNameTone === "light"
      ? `${styles.brandName} ${styles.brandNameOverlayLight}`
      : overlayNameTone === "dark"
        ? `${styles.brandName} ${styles.brandNameOverlayDark}`
        : styles.brandName;

  return (
    <>
      <img
        src={logoSrc}
        alt=""
        width={32}
        height={32}
        decoding="async"
        className={styles.brandIcon}
        aria-hidden
      />
      <span className={brandNameClassName}>{label}</span>
    </>
  );
}

/** Non-interactive current-page nav item (icon + label in accent color). */
export function MainToolbarNavCurrent({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className={styles.navCurrent} aria-current="page">
      <span className={styles.navCurrentIcon} aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </span>
  );
}

/** Pass `className` to a client router link wrapping `MainToolbarBrand`. */
export function MainToolbarBrandAnchor({
  children,
}: {
  children: (className: string) => React.ReactNode;
}) {
  return <>{children(styles.brand)}</>;
}

export function MainToolbar({
  mapPicker,
  search,
  navCurrent,
  leftPromo,
  rightPromo,
  notifications,
  accountMenu,
  logoSrc,
  brandLabel,
  brand,
}: MainToolbarProps) {
  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.left}>
          {brand ?? (
            <div className={styles.brand}>
              <MainToolbarBrand logoSrc={logoSrc} label={brandLabel} />
            </div>
          )}
          {navCurrent}
          {leftPromo ? <div className={styles.promo}>{leftPromo}</div> : null}
          {mapPicker}
          {search ? (
            <div className={styles.search}>
              <div className={styles.searchSlot}>{search}</div>
            </div>
          ) : null}
        </div>
        <div className={styles.right}>
          {rightPromo ? <div className={styles.promo}>{rightPromo}</div> : null}
          {notifications}
          {accountMenu}
        </div>
      </div>
    </header>
  );
}
