import type * as React from "react";

import styles from "./author-row.module.css";

export function AuthorRow({
  avatar,
  name,
}: {
  /** Small avatar shown beside the display name. */
  avatar?: React.ReactNode;
  /** Author display name beside the avatar. */
  name?: React.ReactNode;
}) {
  if (!avatar && !name) return null;

  return (
    <div className={styles.root}>
      {avatar ? <span className={styles.avatar}>{avatar}</span> : null}
      {name ? <span className={styles.name}>{name}</span> : null}
    </div>
  );
}
