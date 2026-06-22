import { landingPlugins } from "../content/landing-plugins";
import {
  countPluginsByStatus,
  PluginsOverviewGrid,
  PluginsOverviewIntro,
} from "../content/plugins-overview";
import {
  MarketingButtonLink,
  MarketingFooter,
  MarketingHeader,
  MarketingLayout,
} from "../shell/marketing-shell";
import styles from "../styles/site.module.css";

const EFFECTIVE_DATE = "22 June 2026";

export function PluginsOverviewPageContent({
  logoSrc = "/icon.png",
}: {
  logoSrc?: string;
} = {}) {
  const availableCount = countPluginsByStatus(landingPlugins, "available");
  const comingSoonCount = countPluginsByStatus(landingPlugins, "coming-soon");

  return (
    <MarketingLayout>
      <MarketingHeader logoSrc={logoSrc} />
      <main>
        <section
          className={styles.section}
          aria-labelledby="plugins-overview-title"
        >
          <div className={styles.sectionHeader}>
            <h1 id="plugins-overview-title" className={styles.sectionTitle}>
              Plugins
            </h1>
            <PluginsOverviewIntro>
              Curolia plugins connect your maps to the apps and data sources you
              already use — photos, music, calendars, points of interest, and
              more. {availableCount} integrations are available today
              {comingSoonCount > 0
                ? ` and ${comingSoonCount} more are on the way`
                : null}
              . Sign in and open Plugins in your account to turn them on or off.
            </PluginsOverviewIntro>
          </div>

          <PluginsOverviewGrid />

          <div className={styles.pluginsOverviewActions}>
            <MarketingButtonLink to="/signup" size="lg">
              Create your first map
            </MarketingButtonLink>
            <MarketingButtonLink to="/login" variant="outline" size="lg">
              Log in
            </MarketingButtonLink>
          </div>

          <p className={styles.pluginsOverviewUpdated}>
            Last updated: {EFFECTIVE_DATE}
          </p>
        </section>
      </main>
      <MarketingFooter />
    </MarketingLayout>
  );
}
