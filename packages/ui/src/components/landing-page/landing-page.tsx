import {
  BookOpen,
  Compass,
  Github,
  MapPinned,
  Plug,
  ShieldCheck,
} from "lucide-react";
import type * as React from "react";
import { Link } from "react-router-dom";

import { buttonClassName } from "../button";
import styles from "./landing-page.module.css";

type MarketingLinkProps = {
  to: string;
  children: React.ReactNode;
  className?: string;
};

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

/** Local landing photography under `apps/web/public/landing/`. */
const defaultLandingImages = {
  hero: {
    src: "/landing/hero.jpg",
    alt: "Sunset over terraced rice fields",
  },
  map: {
    src: "/landing/feature-map.jpg",
    alt: "Winding river through a misty green valley",
  },
  traces: {
    src: "/landing/feature-traces.jpg",
    alt: "Mountain river valley with forest and snow peaks",
  },
  journals: {
    src: "/landing/feature-journals.jpg",
    alt: "Coastal hills with yellow wildflowers above the sea",
  },
  plugins: {
    src: "/landing/feature-plugins.jpg",
    alt: "Sunset over a savanna plain with scattered trees",
  },
} as const;

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

function MarketingLink({ to, children, className }: MarketingLinkProps) {
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

function MarketingButtonLink({
  to,
  children,
  variant = "default",
  size = "default",
}: {
  to: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Link
      to={to}
      className={buttonClassName({
        variant,
        size,
        className: styles.buttonLink,
      })}
    >
      {children}
    </Link>
  );
}

function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

function MarketingHeader({ logoSrc = "/icon.png" }: { logoSrc?: string }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <MarketingLink to="/" className={styles.brand}>
          <img
            className={styles.brandLogo}
            src={logoSrc}
            alt=""
            width={36}
            height={36}
            decoding="async"
          />
          <p className={styles.brandName}>Curolia</p>
        </MarketingLink>

        <div className={styles.headerActions}>
          <MarketingButtonLink to="/login" variant="ghost" size="sm">
            Log in
          </MarketingButtonLink>
          <MarketingButtonLink to="/signup" size="sm">
            Sign up
          </MarketingButtonLink>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerLinks}>
          <MarketingLink to="/contact" className={styles.footerLink}>
            Contact
          </MarketingLink>
          <MarketingLink to="/login" className={styles.footerLink}>
            Log in
          </MarketingLink>
          <MarketingLink to="/signup" className={styles.footerLink}>
            Sign up
          </MarketingLink>
        </div>
        <p className={styles.footerNote}>
          Curolia — your field journal for places and travels.
        </p>
      </div>
    </footer>
  );
}

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
      <main className={styles.contactPage}>
        <div className={styles.contactPanel}>
          <h1 className={styles.contactTitle}>Get in touch</h1>
          <p className={styles.contactLead}>
            Questions, feedback, or partnership ideas? We would love to hear
            from you. Drop us a line and we will get back to you soon.
          </p>
          <a className={styles.contactEmail} href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </div>
      </main>
      <MarketingFooter />
    </MarketingLayout>
  );
}
