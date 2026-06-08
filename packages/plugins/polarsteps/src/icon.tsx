import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";

import styles from "./icon.module.css";

const polarstepsLogo = new URL("./assets/polarsteps-icon.svg", import.meta.url)
  .href;

/** Polarsteps compass mark. */
export function PolarstepsIcon({
  size = 4,
}: {
  className?: string;
  size?: 4 | 5 | 6;
}) {
  return (
    <PluginIconFrame size={size}>
      <img src={polarstepsLogo} alt="" className={styles.logoImg} />
    </PluginIconFrame>
  );
}
