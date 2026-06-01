import styles from "./about-dialog.module.css";

export type NpmLicenseEntry = {
  name: string;
  version: string;
  licenses: string;
  repository?: string;
};

export function NpmLicensesList({ entries }: { entries: NpmLicenseEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className={styles.npmEmpty}>
        No dependency licence data is available. Run{" "}
        <code className={styles.npmCode}>npm run codegen -w @curolia/web</code>{" "}
        to generate the list.
      </p>
    );
  }

  return (
    <ul className={styles.npmList}>
      {entries.map((entry) => {
        const key = `${entry.name}@${entry.version}`;
        return (
          <li key={key} className={styles.npmItem}>
            <span className={styles.npmName}>
              {entry.name}@{entry.version}
            </span>
            <span className={styles.npmLicense}>{entry.licenses}</span>
            {entry.repository ? (
              <a
                className={styles.npmRepo}
                href={entry.repository}
                target="_blank"
                rel="noopener noreferrer"
              >
                Source
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
