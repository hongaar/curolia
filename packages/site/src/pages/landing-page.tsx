import { ContactContent } from "../content/legal-content";
import {
  MarketingFooter,
  MarketingHeader,
  MarketingLayout,
} from "../shell/marketing-shell";
import styles from "../styles/site.module.css";
import { LandingPageMain } from "./landing-sections";
import { PrivacyPolicyPageContent, TermsPageContent } from "./legal-pages";

export function LandingPage({
  logoSrc = "/icon.png",
  githubUrl = "https://github.com/hongaar/curolia",
}: {
  logoSrc?: string;
  githubUrl?: string;
} = {}) {
  return (
    <MarketingLayout>
      <MarketingHeader logoSrc={logoSrc} />
      <main>
        <LandingPageMain githubUrl={githubUrl} />
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
