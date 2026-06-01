import styles from "./about-dialog.module.css";

/** Inline map data attribution (OpenFreeMap / OpenStreetMap). */
export function MapAttributionInline() {
  return (
    <p className={styles.mapAttribution}>
      Map tiles ©{" "}
      <a
        href="https://openfreemap.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        OpenFreeMap
      </a>
      . Map data ©{" "}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
      >
        OpenStreetMap
      </a>{" "}
      contributors and others, under the Open Database License.
    </p>
  );
}
