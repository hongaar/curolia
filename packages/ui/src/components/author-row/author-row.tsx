import type * as React from "react";
import { Link } from "react-router";

import styles from "./author-row.module.css";

export function AuthorRow({
  avatar,
  name,
  nameHref,
}: {
  /** Small avatar shown beside the display name. */
  avatar?: React.ReactNode;
  /** Author display name beside the avatar. */
  name?: React.ReactNode;
  /** When set, the display name links to the author's public profile. */
  nameHref?: string;
}) {
  if (!avatar && !name) return null;

  return (
    <div className={styles.root}>
      {avatar ? <span className={styles.avatar}>{avatar}</span> : null}
      {name ? (
        <span className={styles.name}>
          {nameHref ? (
            <Link className={styles.nameLink} to={nameHref}>
              {name}
            </Link>
          ) : (
            name
          )}
        </span>
      ) : null}
    </div>
  );
}
