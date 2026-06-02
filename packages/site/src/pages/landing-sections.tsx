import { buttonClassName } from "@curolia/ui/button";
import {
  BookOpen,
  Github,
  Globe,
  Lock,
  MapPinned,
  Plug,
  Rss,
  ShieldCheck,
} from "lucide-react";
import type * as React from "react";
import { Link } from "react-router-dom";

import { landingAudiences } from "../content/landing-audiences";
import { landingPlugins } from "../content/landing-plugins";
import type { UnsplashImage } from "../content/unsplash-images";
import { unsplashImages, unsplashProfileUrl } from "../content/unsplash-images";
import { MarketingButtonLink } from "../shell/marketing-shell";
import styles from "../styles/site.module.css";

type LandingFeature = {
  id: string;
  title: string;
  description: string;
  image: UnsplashImage;
  icon: React.ReactNode;
};

const defaultFeatures: LandingFeature[] = [
  {
    id: "map",
    title: "Pin places on the map",
    description:
      "Drop pins anywhere — visits, discoveries, and plans — on a fast interactive map built for exploration.",
    image: unsplashImages.mapFeature,
    icon: <MapPinned aria-hidden size={20} />,
  },
  {
    id: "pins",
    title: "Rich pins with context",
    description:
      "Notes, photos, tags, and links on every pin. Each location becomes a page in your atlas, not just a dot.",
    image: unsplashImages.pinsFeature,
    icon: <BookOpen aria-hidden size={20} />,
  },
  {
    id: "maps",
    title: "Organize in maps",
    description:
      "Separate maps for trips, topics, or groups. Switch context without mixing a food tour with a hiking club.",
    image: unsplashImages.mapsFeature,
    icon: <Globe aria-hidden size={20} />,
  },
  {
    id: "plugins",
    title: "Plugins that fit your workflow",
    description:
      "Connect photos, music, and calendars so pins inherit the apps you already use — more integrations on the way.",
    image: unsplashImages.pluginsFeature,
    icon: <Plug aria-hidden size={20} />,
  },
];

export function LandingHero({
  heroImage = unsplashImages.hero,
}: {
  heroImage?: UnsplashImage;
}) {
  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>For explorers</p>
          <h1 id="landing-hero-title" className={styles.heroTitle}>
            Remember every place you go
          </h1>
          <p className={styles.heroLead}>
            Curolia is an atlas for your explorations — map visits, write notes,
            collect photos, and revisit the story of your trips.
          </p>
          <div className={styles.heroActions}>
            <MarketingButtonLink to="/signup" size="lg">
              Create your first map
            </MarketingButtonLink>
            <MarketingButtonLink to="/login" variant="outline" size="lg">
              Log in
            </MarketingButtonLink>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroFrame}>
            <img
              className={styles.heroImage}
              src={heroImage.src}
              alt={heroImage.alt}
              loading="eager"
              decoding="async"
            />
          </div>
          <div className={styles.heroBadge}>
            <MapPinned aria-hidden size={16} />
            Pins · Notes · Photos
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingAudiences() {
  return (
    <section
      className={styles.section}
      aria-labelledby="landing-audiences-title"
    >
      <div className={styles.sectionHeader}>
        <h2 id="landing-audiences-title" className={styles.sectionTitle}>
          Built for many kinds of explorers
        </h2>
        <p className={styles.sectionLead}>
          One app, many possibilities — pick the story that fits you.
        </p>
      </div>

      <div className={styles.audienceGrid}>
        {landingAudiences.map((audience) => {
          const Icon = audience.icon;
          const body = (
            <>
              <span className={styles.audienceIcon}>
                <Icon aria-hidden size={20} />
              </span>
              <h3 className={styles.audienceTitle}>{audience.title}</h3>
              <p className={styles.audienceDescription}>
                {audience.description}
              </p>
              {audience.campaignPath ? (
                <span className={styles.audienceLinkLabel}>Learn more →</span>
              ) : null}
            </>
          );

          if (audience.campaignPath) {
            return (
              <Link
                key={audience.id}
                to={audience.campaignPath}
                className={styles.audienceCardLink}
              >
                <article className={styles.audienceCard}>{body}</article>
              </Link>
            );
          }

          return (
            <article key={audience.id} className={styles.audienceCard}>
              {body}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function LandingSharing() {
  return (
    <section className={styles.sharing} aria-labelledby="landing-sharing-title">
      <div className={styles.sharingPanel}>
        <div className={styles.sharingCopy}>
          <h2 id="landing-sharing-title" className={styles.sharingTitle}>
            Private, shared, or published
          </h2>
          <p className={styles.sharingLead}>
            Maps are private by default. Invite editors for group projects, or
            publish a map when you want the world to follow along.
          </p>
        </div>
        <ul className={styles.sharingList}>
          <li>
            <Lock aria-hidden size={18} />
            <span>Private maps for personal planning</span>
          </li>
          <li>
            <Rss aria-hidden size={18} />
            <span>Add collaborators to co-create</span>
          </li>
          <li>
            <Globe aria-hidden size={18} />
            <span>Public map and blogs</span>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function LandingPlugins() {
  return (
    <section className={styles.section} aria-labelledby="landing-plugins-title">
      <div className={styles.sectionHeader}>
        <h2 id="landing-plugins-title" className={styles.sectionTitle}>
          Plugins for the apps you already use
        </h2>
        <p className={styles.sectionLead}>
          Enrich pins with photos, music, and calendars. Some are available now
          and others are on the way.
        </p>
      </div>

      <ul className={styles.pluginGrid}>
        {landingPlugins.map((plugin) => (
          <li key={plugin.id} className={styles.pluginCard}>
            <span className={styles.pluginIcon}>{plugin.icon()}</span>
            <div className={styles.pluginBody}>
              <div className={styles.pluginNameRow}>
                <h3 className={styles.pluginName}>{plugin.name}</h3>
                {plugin.status === "coming-soon" ? (
                  <span className={styles.pluginBadge}>Coming soon</span>
                ) : (
                  <span className={styles.pluginBadgeAvailable}>Available</span>
                )}
              </div>
              <p className={styles.pluginDescription}>{plugin.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LandingFeatures({
  features = defaultFeatures,
}: {
  features?: LandingFeature[];
}) {
  return (
    <section
      className={styles.section}
      aria-labelledby="landing-features-title"
    >
      <div className={styles.sectionHeader}>
        <h2 id="landing-features-title" className={styles.sectionTitle}>
          Everything in one atlas
        </h2>
        <p className={styles.sectionLead}>
          Maps, pins, and plugins work together — you stay in control of what to
          share and what to keep offline.
        </p>
      </div>

      <div className={styles.featureGrid}>
        {features.map((feature) => (
          <article key={feature.id} className={styles.featureCard}>
            <div className={styles.featureImageWrap}>
              <img
                className={styles.featureImage}
                src={feature.image.src}
                alt={feature.image.alt}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className={styles.featureBody}>
              <span className={styles.featureIcon}>{feature.icon}</span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LandingOpenSource({
  githubUrl = "https://github.com/hongaar/curolia",
}: {
  githubUrl?: string;
}) {
  return (
    <section
      className={styles.openSource}
      aria-labelledby="landing-open-source-title"
    >
      <div className={styles.openSourcePanel}>
        <div className={styles.openSourceCopy}>
          <span className={styles.openSourceIcon} aria-hidden>
            <ShieldCheck size={22} />
          </span>
          <h2 id="landing-open-source-title" className={styles.openSourceTitle}>
            Open and private
          </h2>
          <p className={styles.openSourceLead}>
            Curolia is built in the open. Browse the code, open issues, or
            contribute plugins on GitHub. Your data is stored in the European
            Union — we never sell it, track you for ads, or train AI on it.
          </p>
        </div>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassName({
            variant: "outline",
            size: "lg",
            className: styles.externalButtonLink,
          })}
        >
          <Github aria-hidden size={18} />
          View on GitHub
        </a>
      </div>
    </section>
  );
}

export function LandingCta() {
  return (
    <section className={styles.cta} aria-labelledby="landing-cta-title">
      <div className={styles.ctaPanel}>
        <div className={styles.ctaCopy}>
          <h2 id="landing-cta-title" className={styles.ctaTitle}>
            Ready to map what matters?
          </h2>
          <p className={styles.ctaLead}>
            Create a free account and start pinning. Your first map is private —
            publish when you are ready.
          </p>
        </div>
        <MarketingButtonLink to="/signup" size="lg">
          Create account
        </MarketingButtonLink>
      </div>
    </section>
  );
}

export function LandingPhotoCredits({ images }: { images: UnsplashImage[] }) {
  const unique = images.filter(
    (img, index, arr) =>
      arr.findIndex((i) => i.credit.username === img.credit.username) === index,
  );

  return (
    <p className={styles.photoCredits}>
      Photos{" "}
      {unique.map((img, i) => (
        <span key={img.credit.username}>
          {i > 0 ? ", " : null}
          <a
            href={unsplashProfileUrl(img.credit)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {img.credit.name}
          </a>
        </span>
      ))}{" "}
      on{" "}
      <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
        Unsplash
      </a>
    </p>
  );
}

export function LandingPageMain({
  githubUrl = "https://github.com/hongaar/curolia",
}: {
  githubUrl?: string;
} = {}) {
  const creditImages = [
    unsplashImages.hero,
    unsplashImages.mapFeature,
    unsplashImages.pinsFeature,
    unsplashImages.mapsFeature,
    unsplashImages.pluginsFeature,
  ];

  return (
    <>
      <LandingHero />
      <LandingAudiences />
      <LandingSharing />
      <LandingPlugins />
      <LandingFeatures />
      <LandingOpenSource githubUrl={githubUrl} />
      <LandingCta />
      <LandingPhotoCredits images={creditImages} />
    </>
  );
}
