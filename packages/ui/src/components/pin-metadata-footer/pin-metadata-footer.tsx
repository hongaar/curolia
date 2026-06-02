import type * as React from "react";

import styles from "./pin-metadata-footer.module.css";

export type PinMetadataFooterProps = {
  /** Primary created timestamp or source line. */
  createdLine: React.ReactNode;
  /** Optional last-modified line; hidden when omitted. */
  modifiedLine?: React.ReactNode;
};

export function PinMetadataFooter({
  createdLine,
  modifiedLine,
}: PinMetadataFooterProps) {
  return (
    <footer className={styles.footer}>
      {modifiedLine ? (
        <p className={styles.modified}>{modifiedLine}</p>
      ) : (
        <p>{createdLine}</p>
      )}
    </footer>
  );
}
