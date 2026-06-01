import { Globe, Lock, MapPinned, Rss } from "lucide-react";
import type { CSSProperties } from "react";

import type { CampaignTheme } from "../content/campaigns";
import {
  MarketingButtonLink,
  MarketingFooter,
  MarketingHeader,
  MarketingLayout,
} from "../shell/marketing-shell";
import campaignStyles from "../styles/campaign.module.css";
import styles from "../styles/site.module.css";
import { LandingPhotoCredits } from "./landing-sections";

type CampaignLandingPageProps = {
  campaign: CampaignTheme;
  logoSrc?: string;
};

export function CampaignLandingPage({
  campaign,
  logoSrc = "/icon.png",
}: CampaignLandingPageProps) {
  const accentSecondary = campaign.accentHueSecondary ?? campaign.accentHue;

  return (
    <MarketingLayout>
      <MarketingHeader logoSrc={logoSrc} />
      <main
        className={campaignStyles.campaignPage}
        style={
          {
            "--campaign-accent": campaign.accentHue,
            "--campaign-accent-secondary": accentSecondary,
          } as CSSProperties
        }
      >
        <section
          className={campaignStyles.campaignHero}
          aria-labelledby="campaign-hero-title"
        >
          <div className={campaignStyles.campaignHeroMedia}>
            <img
              className={campaignStyles.campaignHeroImage}
              src={campaign.heroImage.src}
              alt={campaign.heroImage.alt}
              loading="eager"
              decoding="async"
            />
            <div className={campaignStyles.campaignHeroScrim} aria-hidden />
          </div>

          <div className={campaignStyles.campaignHeroCopy}>
            <p className={campaignStyles.campaignEyebrow}>
              For {campaign.eyebrow}
            </p>
            <h1
              id="campaign-hero-title"
              className={campaignStyles.campaignTitle}
            >
              {campaign.title}
            </h1>
            <p className={campaignStyles.campaignLead}>{campaign.lead}</p>
            <div className={styles.heroActions}>
              <MarketingButtonLink to="/signup" size="lg">
                {campaign.ctaLabel}
              </MarketingButtonLink>
              <MarketingButtonLink to="/login" variant="outline" size="lg">
                Log in
              </MarketingButtonLink>
            </div>
          </div>
        </section>

        <section
          className={campaignStyles.campaignBody}
          aria-labelledby="campaign-features-title"
        >
          <h2
            id="campaign-features-title"
            className={campaignStyles.campaignSectionTitle}
          >
            Curolia features for {campaign.eyebrow}
          </h2>
          <ul className={campaignStyles.campaignBulletList}>
            {campaign.bullets.map((bullet) => (
              <li key={bullet} className={campaignStyles.campaignBullet}>
                <MapPinned aria-hidden size={18} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className={campaignStyles.campaignHighlights}>
            <article className={campaignStyles.campaignHighlight}>
              <Lock aria-hidden size={20} />
              <h3>Private by default</h3>
              <p>Maps stay yours until you invite collaborators or publish.</p>
            </article>
            <article className={campaignStyles.campaignHighlight}>
              <Globe aria-hidden size={20} />
              <h3>Publish as a blog</h3>
              <p>
                Share a map-backed blog for readers who want the full route.
              </p>
            </article>
            <article className={campaignStyles.campaignHighlight}>
              <Rss aria-hidden size={20} />
              <h3>Plugins & feeds</h3>
              <p>Photos, music, and calendar apps enrich each pin.</p>
            </article>
          </div>

          <div className={campaignStyles.campaignCta}>
            <MarketingButtonLink to="/signup" size="lg">
              {campaign.ctaLabel}
            </MarketingButtonLink>
            <MarketingButtonLink to="/" variant="ghost" size="lg">
              See all use cases
            </MarketingButtonLink>
          </div>
        </section>

        <LandingPhotoCredits images={[campaign.heroImage]} />
      </main>
      <MarketingFooter />
    </MarketingLayout>
  );
}
