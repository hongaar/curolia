import styles from "./about-dialog.module.css";
import { MapAttributionInline } from "./map-attribution";

export function AboutMapAttributionSection() {
  return (
    <section className={styles.section} aria-label="Map attribution">
      <h3 className={styles.sectionTitle}>Map data</h3>
      <MapAttributionInline />
    </section>
  );
}
