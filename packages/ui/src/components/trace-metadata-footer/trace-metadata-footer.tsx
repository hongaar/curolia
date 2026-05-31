import type * as React from "react";

import styles from "./trace-metadata-footer.module.css";

export type TraceMetadataFooterProps = {
  /** Primary created timestamp or source line. */
  createdLine: React.ReactNode;
  /** Optional last-modified line; hidden when omitted. */
  modifiedLine?: React.ReactNode;
};

export function TraceMetadataFooter({
  createdLine,
  modifiedLine,
}: TraceMetadataFooterProps) {
  return (
    <footer className={styles.footer}>
      <p>{createdLine}</p>
      {modifiedLine ? <p className={styles.modified}>{modifiedLine}</p> : null}
    </footer>
  );
}
