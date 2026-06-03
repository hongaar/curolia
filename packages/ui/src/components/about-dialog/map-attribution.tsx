import styles from "./about-dialog.module.css";

/** Inline map data attribution for basemap tiles used in the app. */
export function MapAttributionInline() {
  return (
    <p className={styles.mapAttribution}>
      Map tiles and styles from{" "}
      <a
        href="https://openfreemap.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        OpenFreeMap
      </a>{" "}
      (Positron, Dark, and Liberty styles) . Satellite imagery ©{" "}
      <a
        href="https://www.esri.com/en-us/legal/terms/full-master-agreement"
        target="_blank"
        rel="noopener noreferrer"
      >
        Esri
      </a>
      . Optional labels use the same OpenFreeMap vector data as street maps.
      Optional hillshades from{" "}
      <a
        href="https://mapterhorn.com/attribution"
        target="_blank"
        rel="noopener noreferrer"
      >
        Mapterhorn
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
