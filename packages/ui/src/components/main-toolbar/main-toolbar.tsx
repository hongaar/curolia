import type * as React from "react";

import styles from "./main-toolbar.module.css";

export type MainToolbarProps = {
  /** Map selector control (e.g. dropdown trigger). */
  mapPicker?: React.ReactNode;
  /** Search slot beside map picker (hidden on small viewports via CSS). */
  search?: React.ReactNode;
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
}: {
  logoSrc?: string;
  label?: string;
}) {
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
      <span className={styles.brandName}>{label}</span>
    </>
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
          {mapPicker}
          {search ? (
            <div className={styles.search}>
              <div className={styles.searchSlot}>{search}</div>
            </div>
          ) : null}
        </div>
        <div className={styles.right}>{accountMenu}</div>
      </div>
    </header>
  );
}
