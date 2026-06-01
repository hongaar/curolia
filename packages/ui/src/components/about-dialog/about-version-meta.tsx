import styles from "./about-dialog.module.css";

export function AboutVersionMeta({ version }: { version: string }) {
  return (
    <div className={styles.meta}>
      <span className={styles.versionLabel}>Version</span>
      <span className={styles.versionValue}>{version}</span>
    </div>
  );
}
