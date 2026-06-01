import { buttonClassName } from "@curolia/ui/button";
import {
  BookOpen,
  Compass,
  Github,
  MapPinned,
  Plug,
  ShieldCheck,
} from "lucide-react";
import type * as React from "react";

import { ContactContent } from "../content/legal-content";
import {
  MarketingButtonLink,
  MarketingFooter,
  MarketingHeader,
  MarketingLayout,
} from "../shell/marketing-shell";
import styles from "../styles/site.module.css";
import { defaultLandingImages } from "./landing-images";
import { PrivacyPolicyPageContent, TermsPageContent } from "./legal-pages";

type LandingFeature = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  icon: React.ReactNode;
};

type LandingPageProps = {
  heroImageSrc: string;
  heroImageAlt?: string;
  features: LandingFeature[];
  contactEmail?: string;
};

const defaultFeatures: LandingFeature[] = [
  {
    id: "map",
    title: "Map your journeys",
    description:
      "Drop pins for every place you have been and see your travels unfold on a beautiful interactive map.",
    imageSrc: defaultLandingImages.map.src,
    imageAlt: defaultLandingImages.map.alt,
    icon: <MapPinned aria-hidden size={20} />,
  },
  {
    id: "traces",
    title: "Capture traces",
    description:
      "Record visits with notes, photos, and tags. Each trace becomes a rich memory tied to a place.",
    imageSrc: defaultLandingImages.traces.src,
    imageAlt: defaultLandingImages.traces.alt,
    icon: <BookOpen aria-hidden size={20} />,
  },
  {
    id: "journals",
    title: "Organize in journals",
    description:
      "Keep trips, regions, or themes in separate journals. Switch contexts without losing the thread.",
    imageSrc: defaultLandingImages.journals.src,
    imageAlt: defaultLandingImages.journals.alt,
    icon: <Compass aria-hidden size={20} />,
  },
  {
    id: "plugins",
    title: "Extend with plugins",
    description:
      "Connect Google Photos, Spotify, calendars, and more to enrich traces with the content you already have.",
    imageSrc: defaultLandingImages.plugins.src,
    imageAlt: defaultLandingImages.plugins.alt,
    icon: <Plug aria-hidden size={20} />,
  },
];

function LandingHero({
  heroImageSrc,
  heroImageAlt = "Curolia map and journal preview",
}: Pick<LandingPageProps, "heroImageSrc" | "heroImageAlt">) {
  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Travel journal</p>
          <h1 id="landing-hero-title" className={styles.heroTitle}>
            Remember every place you go
          </h1>
          <p className={styles.heroLead}>
            Curolia is a private atlas for your travels — map visits, write
            traces, collect photos, and revisit the story of where you have
            been.
          </p>
          <div className={styles.heroActions}>
            <MarketingButtonLink to="/signup" size="lg">
              Start your journal
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
              src={heroImageSrc}
              alt={heroImageAlt}
              loading="eager"
              decoding="async"
            />
          </div>
          <div className={styles.heroBadge}>
            <MapPinned aria-hidden size={16} />
            Map · traces · photos
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFeatures({
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
          Built by explorers, for explorers
        </h2>
        <p className={styles.sectionLead}>
          Everything you need to capture where you have been — you remain in
          control and decide who gets to see it.
        </p>
      </div>

      <div className={styles.featureGrid}>
        {features.map((feature) => (
          <article key={feature.id} className={styles.featureCard}>
            <div className={styles.featureImageWrap}>
              <img
                className={styles.featureImage}
                src={feature.imageSrc}
                alt={feature.imageAlt}
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

function LandingOpenSource({
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
            Curolia is built in the open. Feel free to browse the code, open
            issues, or contribute plugins and improvements on GitHub. Your data
            is stored in the European Union and we'll never sell it to anyone,
            track you or train AI on it.
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

function LandingCta() {
  return (
    <section className={styles.cta} aria-labelledby="landing-cta-title">
      <div className={styles.ctaPanel}>
        <div className={styles.ctaCopy}>
          <h2 id="landing-cta-title" className={styles.ctaTitle}>
            Ready to start exploring?
          </h2>
          <p className={styles.ctaLead}>
            Create a free account and start pinning the places that matter to
            you. Your journal is private by default.
          </p>
        </div>
        <MarketingButtonLink to="/signup" size="lg">
          Create account
        </MarketingButtonLink>
      </div>
    </section>
  );
}

export function LandingPage({
  heroImageSrc = defaultLandingImages.hero.src,
  heroImageAlt = defaultLandingImages.hero.alt,
  features = defaultFeatures,
  logoSrc = "/icon.png",
  githubUrl = "https://github.com/hongaar/curolia",
}: Partial<LandingPageProps> & {
  logoSrc?: string;
  githubUrl?: string;
} = {}) {
  return (
    <MarketingLayout>
      <MarketingHeader logoSrc={logoSrc} />
      <main>
        <LandingHero heroImageSrc={heroImageSrc} heroImageAlt={heroImageAlt} />
        <LandingFeatures features={features} />
        <LandingOpenSource githubUrl={githubUrl} />
        <LandingCta />
      </main>
      <MarketingFooter />
    </MarketingLayout>
  );
}

export function ContactPageContent({
  contactEmail = "hello@curolia.com",
  logoSrc = "/icon.png",
}: {
  contactEmail?: string;
  logoSrc?: string;
}) {
  return (
    <MarketingLayout>
      <MarketingHeader logoSrc={logoSrc} />
      <main className={styles.legalPage}>
        <div className={styles.contactPanel}>
          <h1 className={styles.contactTitle}>Get in touch</h1>
          <ContactContent contactEmail={contactEmail} />
        </div>
      </main>
      <MarketingFooter />
    </MarketingLayout>
  );
}

export { PrivacyPolicyPageContent, TermsPageContent };
