import type * as React from "react";

import styles from "./trace-metadata-footer.module.css";

export function TraceMetadataFooter({
  createdLine,
  modifiedLine,
}: {
  createdLine: React.ReactNode;
  modifiedLine?: React.ReactNode;
}) {
  return (
    <footer className={styles.footer}>
      <p>{createdLine}</p>
      {modifiedLine ? <p className={styles.modified}>{modifiedLine}</p> : null}
    </footer>
  );
}
