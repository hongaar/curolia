import type { ReactNode } from "react";

import styles from "../styles/site.module.css";
import {
  landingPlugins,
  type LandingPlugin,
  type LandingPluginStatus,
} from "./landing-plugins";

function sortPlugins(plugins: readonly LandingPlugin[]): LandingPlugin[] {
  return [...plugins].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "coming-soon" ? 1 : -1;
  });
}

export function PluginsOverviewGrid({
  plugins = landingPlugins,
}: {
  plugins?: readonly LandingPlugin[];
}) {
  return (
    <ul className={styles.pluginGrid}>
      {sortPlugins(plugins).map((plugin) => (
        <li key={plugin.id} className={styles.pluginCard}>
          <span className={styles.pluginIcon}>{plugin.icon()}</span>
          <div className={styles.pluginBody}>
            <div className={styles.pluginNameRow}>
              <h3 className={styles.pluginName}>{plugin.name}</h3>
              {plugin.status === "coming-soon" ? (
                <span className={styles.pluginBadge}>Coming soon</span>
              ) : null}
            </div>
            <p className={styles.pluginDescription}>{plugin.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PluginsOverviewIntro({ children }: { children: ReactNode }) {
  return <p className={styles.pluginsOverviewIntro}>{children}</p>;
}

export function countPluginsByStatus(
  plugins: readonly LandingPlugin[],
  status: LandingPluginStatus,
): number {
  return plugins.filter((plugin) => plugin.status === status).length;
}
