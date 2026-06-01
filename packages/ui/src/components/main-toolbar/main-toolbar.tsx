import type * as React from "react";

import styles from "./main-toolbar.module.css";

export type MainToolbarProps = {
  /** Map selector control (e.g. dropdown trigger). */
  mapPicker?: React.ReactNode;
  /** Center search slot (hidden on small viewports via CSS). */
  search?: React.ReactNode;
  accountMenu: React.ReactNode;
  /** App icon URL (defaults to `/favicon.png`). */
  logoSrc?: string;
  /** Brand wordmark beside the icon. */
  brandLabel?: string;
};

export function MainToolbarBrand({
  logoSrc = "/favicon.png",
  label = "Curolia",
}: {
  logoSrc?: string;
  label?: string;
}) {
  return (
    <div className={styles.brand}>
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
    </div>
  );
}

export function MainToolbar({
  mapPicker,
  search,
  accountMenu,
  logoSrc,
  brandLabel,
}: MainToolbarProps) {
  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <MainToolbarBrand logoSrc={logoSrc} label={brandLabel} />
          {mapPicker}
        </div>
        {search ? (
          <div className={styles.center}>
            <div className={styles.searchSlot}>{search}</div>
          </div>
        ) : null}
        <div className={styles.right}>{accountMenu}</div>
      </div>
    </header>
  );
}
