import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";

import styles from "./icon.module.css";

const wikipediaLogo = new URL("./assets/wikipedia-logo.svg", import.meta.url)
  .href;

/** Wikipedia puzzle globe (Wikimedia Commons, CC BY-SA 3.0). */
export function WikidataIcon({
  size = 5,
}: {
  className?: string;
  size?: 4 | 5 | 6;
}) {
  return (
    <PluginIconFrame size={size}>
      <img src={wikipediaLogo} alt="" className={styles.logoImg} />
    </PluginIconFrame>
  );
}
