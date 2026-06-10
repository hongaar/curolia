import type * as React from "react";
import { Link } from "react-router-dom";

import styles from "../styles/site.module.css";

export type LegalNavTarget =
  | "contact"
  | "privacy"
  | "terms"
  | "licenses"
  | "openSource";

export type LegalContentProps = {
  contactEmail?: string;
  embedded?: boolean;
  onNavigate?: (target: LegalNavTarget) => void;
  /** Generated npm dependency licence list (injected by apps/web). */
  npmLicenses?: React.ReactNode;
};

const LEGAL_PATHS: Record<LegalNavTarget, string> = {
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  licenses: "/licenses",
  openSource: "/open-source",
};

export function LegalEmbed({ children }: { children: React.ReactNode }) {
  return <div className={styles.legalEmbed}>{children}</div>;
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.legalSection}>
      <h2 className={styles.legalSectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p className={styles.legalParagraph}>{children}</p>;
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.legalList}>{children}</ul>;
}

export function LegalNavLink({
  target,
  children,
  embedded,
  onNavigate,
}: {
  target: LegalNavTarget;
  children: React.ReactNode;
} & Pick<LegalContentProps, "embedded" | "onNavigate">) {
  if (embedded && onNavigate) {
    return (
      <button
        type="button"
        className={`${styles.legalInlineLink} ${styles.legalInlineButton}`}
        onClick={() => onNavigate(target)}
      >
        {children}
      </button>
    );
  }
  return (
    <Link className={styles.legalInlineLink} to={LEGAL_PATHS[target]}>
      {children}
    </Link>
  );
}

export function ContactContent({
  contactEmail = "hello@curolia.com",
  embedded,
  onNavigate,
}: LegalContentProps) {
  return (
    <>
      <p className={embedded ? styles.legalParagraph : styles.contactLead}>
        Questions, feedback, or partnership ideas? We would love to hear from
        you. Drop us a line and we will get back to you soon.
      </p>
      <a
        className={embedded ? styles.legalInlineLink : styles.contactEmail}
        href={`mailto:${contactEmail}`}
      >
        {contactEmail}
      </a>
      <p className={embedded ? styles.legalParagraph : styles.contactLegalNote}>
        See our{" "}
        <LegalNavLink
          target="privacy"
          embedded={embedded}
          onNavigate={onNavigate}
        >
          Privacy Policy
        </LegalNavLink>{" "}
        and{" "}
        <LegalNavLink
          target="terms"
          embedded={embedded}
          onNavigate={onNavigate}
        >
          Terms and Conditions
        </LegalNavLink>
        .
      </p>
    </>
  );
}

export function PrivacyPolicyContent({
  contactEmail = "hello@curolia.com",
  embedded,
  onNavigate,
}: LegalContentProps) {
  return (
    <>
      <LegalParagraph>
        This Privacy Policy explains how Curolia (&quot;we&quot;,
        &quot;us&quot;) collects, uses, and protects personal data when you use
        our website and apps (the &quot;Service&quot;). We process data in line
        with applicable privacy laws, including the GDPR where it applies.
      </LegalParagraph>

      <LegalSection title="Who we are">
        <LegalParagraph>
          Curolia is a map service. For privacy-related questions, contact us at{" "}
          <a className={styles.legalInlineLink} href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Data we collect">
        <LegalList>
          <li>
            <strong>Account data:</strong> email address and authentication
            credentials (passwords are handled by our auth provider; we do not
            store plain-text passwords).
          </li>
          <li>
            <strong>Profile data:</strong> optional display name, avatar, and
            preferences you choose in settings.
          </li>
          <li>
            <strong>Map content:</strong> maps, pins, places, notes, photos,
            tags, and other material you create or upload.
          </li>
          <li>
            <strong>Connected services:</strong> if you enable plugins (for
            example calendars or media providers), we process data needed to
            link and sync those services according to your configuration.
          </li>
          <li>
            <strong>Technical data:</strong> device and usage information such
            as IP address, browser type, and logs needed to operate and secure
            the Service.
          </li>
          <li>
            <strong>Usage analytics:</strong> page paths and in-app navigation
            (for example which screens you open), plus coarse device and browser
            metadata collected through our analytics tool — see Analytics below.
          </li>
          <li>
            <strong>Error reports:</strong> when the app fails unexpectedly, we
            may receive crash information such as error messages, stack traces,
            browser type, and app version — see Error reporting below. We do not
            include your map content or passwords in these reports.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="How we use your data">
        <LegalList>
          <li>Provide, maintain, and improve the Service.</li>
          <li>Authenticate you and keep your account secure.</li>
          <li>Store and display your maps and pins as you direct.</li>
          <li>
            Send service messages (for example password reset or invitations).
          </li>
          <li>Comply with legal obligations and enforce our Terms.</li>
        </LegalList>
        <LegalParagraph>
          We do not sell your personal data. We do not use your map content to
          train third-party AI models.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Legal bases (EEA users)">
        <LegalParagraph>
          Where the GDPR applies, we rely on: performance of our contract with
          you (providing the Service); legitimate interests (security, abuse
          prevention, and product improvement); and consent where required (for
          example optional integrations or notifications you can turn off).
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Analytics">
        <LegalParagraph>
          We use privacy-focused website analytics (Umami) to understand how the
          Service is used — for example which pages are visited and how users
          move between screens. Umami does not use advertising cookies and does
          not track you across other websites. Analytics may include a truncated
          or hashed IP address, browser type, device type, operating system,
          referrer, and the page path you view. We use this information to
          improve the Service, not to sell your data or profile you for
          advertising.
        </LegalParagraph>
        <LegalParagraph>
          Analytics is provided by Umami Software (hosted at{" "}
          <a
            className={styles.legalInlineLink}
            href="https://umami.is/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            cloud.umami.is
          </a>
          ) as our processor. You can limit tracking with browser Do Not Track
          settings or content blockers; the Service remains usable without
          analytics.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Error reporting">
        <LegalParagraph>
          We use Bugsink, a privacy-focused error tracking service, to learn
          when the Service crashes or hits unexpected errors. Reports may
          include error messages, stack traces, browser and device type, app
          version, and coarse session metadata. We use this information only to
          diagnose and fix bugs — not for advertising or profiling.
        </LegalParagraph>
        <LegalParagraph>
          Error reporting is provided by Bugsink B.V. (hosted in the European
          Union) as our processor. See{" "}
          <a
            className={styles.legalInlineLink}
            href="https://www.bugsink.com/gdpr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bugsink&apos;s GDPR information
          </a>
          . You can limit reporting with browser extensions that block error
          trackers; the Service remains usable without it.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Sharing and processors">
        <LegalParagraph>
          We use trusted infrastructure and service providers (for example
          hosting, authentication, email delivery, privacy-focused analytics,
          error reporting, and optional plugin providers you connect). They
          process data only on our instructions and under appropriate
          safeguards. Map content is private by default; we share it only when
          you use sharing features or when required by law.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Storage and transfers">
        <LegalParagraph>
          We aim to store and process data in the European Union. If data is
          transferred outside the EEA, we use appropriate safeguards such as
          standard contractual clauses where required.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Retention">
        <LegalParagraph>
          We keep your data while your account is active and for a reasonable
          period afterward so you can recover content or so we can meet legal
          obligations. You may delete content in the app or close your account;
          we will then delete or anonymise data unless we must retain it by law.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Your rights">
        <LegalParagraph>
          Depending on where you live, you may have rights to access, correct,
          delete, restrict, or port your personal data, and to object to certain
          processing. You may also lodge a complaint with your local supervisory
          authority. To exercise your rights, email{" "}
          <a className={styles.legalInlineLink} href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Security">
        <LegalParagraph>
          We apply technical and organisational measures appropriate to the
          nature of the data, including encryption in transit and access
          controls. No online service can guarantee absolute security.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Children">
        <LegalParagraph>
          The Service is not directed at children under 16. If you believe a
          child has provided us personal data, contact us and we will take
          appropriate steps.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Changes">
        <LegalParagraph>
          We may update this policy from time to time. We will post the revised
          version on this page and update the effective date above.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Related">
        <LegalParagraph>
          See also our{" "}
          <LegalNavLink
            target="terms"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Terms and Conditions
          </LegalNavLink>{" "}
          and{" "}
          <LegalNavLink
            target="openSource"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Open source at Curolia
          </LegalNavLink>
          .
        </LegalParagraph>
      </LegalSection>
    </>
  );
}

export function TermsContent({
  contactEmail = "hello@curolia.com",
  embedded,
  onNavigate,
}: LegalContentProps) {
  return (
    <>
      <LegalParagraph>
        These Terms and Conditions (&quot;Terms&quot;) govern your use of
        Curolia (&quot;we&quot;, &quot;us&quot;) and our website and apps (the
        &quot;Service&quot;). By creating an account or using the Service, you
        agree to these Terms.
      </LegalParagraph>

      <LegalSection title="The Service">
        <LegalParagraph>
          Curolia lets you map places, write pins, organise maps, attach media,
          and optionally connect third-party plugins. Features may change as we
          improve the product. We may suspend or discontinue parts of the
          Service with reasonable notice where practicable.
        </LegalParagraph>
        <LegalParagraph>
          We collect limited usage analytics and error reports (such as page
          views, in-app navigation, and crash diagnostics) as described in our{" "}
          <LegalNavLink
            target="privacy"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Privacy Policy
          </LegalNavLink>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Your account">
        <LegalList>
          <li>
            You must provide accurate account information and keep it current.
          </li>
          <li>
            You are responsible for activity on your account and for keeping
            your credentials confidential.
          </li>
          <li>
            You must be at least 16 years old, or the minimum age required in
            your country, to use the Service.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Your content">
        <LegalParagraph>
          You retain ownership of content you submit. You grant us a limited
          licence to host, back up, display, and process your content solely to
          operate and improve the Service, including sharing it when you use
          sharing or collaboration features you enable.
        </LegalParagraph>
        <LegalParagraph>
          You must have the rights to any content you upload (including photos
          and text). Do not upload unlawful, infringing, or harmful material.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <LegalList>
          <li>Do not break the law or others&apos; rights.</li>
          <li>Do not probe, disrupt, or overload our systems.</li>
          <li>Do not scrape or misuse the Service except as we allow.</li>
          <li>Do not impersonate others or misrepresent your affiliation.</li>
        </LegalList>
        <LegalParagraph>
          We may remove content or suspend accounts that violate these Terms or
          pose risk to the Service or other users.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Third-party plugins">
        <LegalParagraph>
          Optional integrations are provided by third parties under their own
          terms and privacy policies. Enabling a plugin authorises us to
          exchange data with that provider as needed for the integration. We are
          not responsible for third-party services.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Open source">
        <LegalParagraph>
          Curolia is built with open source software and an open development
          model. Portions of the product may be available under open-source
          licences; your use of that code is governed by those licences. These
          Terms still apply to the hosted Service we operate for you. Read more
          in{" "}
          <LegalNavLink
            target="openSource"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Open source at Curolia
          </LegalNavLink>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <LegalParagraph>
          The Service is provided &quot;as is&quot; and &quot;as
          available&quot;. To the fullest extent permitted by law, we disclaim
          warranties of merchantability, fitness for a particular purpose, and
          non-infringement. We do not guarantee uninterrupted or error-free
          operation.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <LegalParagraph>
          To the fullest extent permitted by law, we are not liable for
          indirect, incidental, special, consequential, or punitive damages, or
          for loss of profits, data, or goodwill. Our total liability for claims
          relating to the Service is limited to the greater of amounts you paid
          us in the twelve months before the claim (if any) or EUR 100, except
          where liability cannot be limited under applicable law.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Termination">
        <LegalParagraph>
          You may stop using the Service at any time. We may suspend or
          terminate your access if you materially breach these Terms or if
          required for legal or security reasons. Provisions that by nature
          should survive termination will survive.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Governing law">
        <LegalParagraph>
          These Terms are governed by the laws of the Netherlands, without
          regard to conflict-of-law rules, except where mandatory consumer
          protections in your country apply. Disputes shall be submitted to the
          competent courts in the Netherlands unless otherwise required by law.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalParagraph>
          Questions about these Terms:{" "}
          <a className={styles.legalInlineLink} href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . See also our{" "}
          <LegalNavLink
            target="privacy"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Privacy Policy
          </LegalNavLink>
          .
        </LegalParagraph>
      </LegalSection>
    </>
  );
}

export function OpenSourceLicensesSummaryContent({
  embedded,
  onNavigate,
  npmLicenses,
}: LegalContentProps) {
  return (
    <>
      <LegalParagraph>
        Curolia is built with open source software. The summary below covers map
        data and 3rd party dependency licences shipped with the web app.
      </LegalParagraph>

      <LegalSection title="Map tiles and data">
        <LegalParagraph>
          Interactive maps use vector tiles and styles from{" "}
          <a
            className={styles.legalInlineLink}
            href="https://openfreemap.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenFreeMap
          </a>{" "}
          (including Positron, Dark, and Liberty styles). Maps set to satellite
          view use imagery from{" "}
          <a
            className={styles.legalInlineLink}
            href="https://www.esri.com/en-us/legal/terms/full-master-agreement"
            target="_blank"
            rel="noopener noreferrer"
          >
            Esri
          </a>
          ; optional place labels use OpenFreeMap vector tiles. Optional
          hillshades may use elevation data from{" "}
          <a
            className={styles.legalInlineLink}
            href="https://mapterhorn.com/attribution"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mapterhorn
          </a>
          . Underlying geographic data includes contributions from{" "}
          <a
            className={styles.legalInlineLink}
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap
          </a>{" "}
          contributors, available under the{" "}
          <a
            className={styles.legalInlineLink}
            href="https://opendatacommons.org/licenses/odbl/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Database License (ODbL)
          </a>
          .
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="App dependencies">
        {npmLicenses ? (
          <>
            <LegalParagraph>
              The website and app uses various 3rd party dependencies.
            </LegalParagraph>
            <details className={styles.legalDetails}>
              <summary className={styles.legalSummary}>
                View complete list
              </summary>
              <div className={styles.legalDetailsPanel}>{npmLicenses}</div>
            </details>
          </>
        ) : (
          <LegalParagraph>
            The complete dependency licence list for all production packages
            used by the web app is available on the{" "}
            {embedded && onNavigate ? (
              <button
                type="button"
                className={`${styles.legalInlineLink} ${styles.legalInlineButton}`}
                onClick={() => onNavigate("licenses")}
              >
                open source licenses
              </button>
            ) : (
              <Link className={styles.legalInlineLink} to="/licenses">
                open source licenses
              </Link>
            )}{" "}
            page.
          </LegalParagraph>
        )}
      </LegalSection>

      <LegalSection title="Related">
        <LegalParagraph>
          See also{" "}
          <LegalNavLink
            target="openSource"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Open source at Curolia
          </LegalNavLink>
          ,{" "}
          <LegalNavLink
            target="privacy"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Privacy Policy
          </LegalNavLink>
          ,{" "}
          <LegalNavLink
            target="terms"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Terms and Conditions
          </LegalNavLink>
          , and{" "}
          <LegalNavLink
            target="contact"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Contact
          </LegalNavLink>
          .
        </LegalParagraph>
      </LegalSection>
    </>
  );
}

export function OpenSourceMindsetContent({
  embedded,
  onNavigate,
  githubUrl = "https://github.com/hongaar/curolia",
}: LegalContentProps & { githubUrl?: string }) {
  return (
    <>
      <LegalParagraph>
        Curolia is built in the open. We believe map software should be
        transparent, inspectable, and respectful of the people who use it — not
        a black box that monetises your memories.
      </LegalParagraph>

      <LegalSection title="Why open source matters to us">
        <LegalParagraph>
          Open source lets anyone review how the product works, contribute
          improvements, and run their own copy if they choose. That aligns with
          how we think about trust: you should not have to take our word for it.
        </LegalParagraph>
        <LegalParagraph>
          Our code lives on{" "}
          <a
            className={styles.legalInlineLink}
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          . Issues, discussions, and pull requests are welcome.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="How we choose third-party services">
        <LegalParagraph>
          No product is an island. We rely on external services for hosting,
          authentication, analytics, and more. When we pick a provider, we look
          for three things:
        </LegalParagraph>
        <LegalList>
          <li>
            <strong>Open source</strong> — we prefer software we (and you) can
            read, audit, and self-host where practical.
          </li>
          <li>
            <strong>Security</strong> — sensible defaults, clear data handling,
            and infrastructure we would trust with our own maps.
          </li>
          <li>
            <strong>Privacy</strong> — providers that collect only what they
            need, do not sell personal data, and share our view that your map
            content is yours.
          </li>
        </LegalList>
        <LegalParagraph>
          We are pragmatic: not every layer of the stack is fully open source
          today. When a proprietary option is unavoidable, we still apply the
          same bar for security and privacy, keep data in the European Union
          where we can, and favour processors with transparent practices.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Examples in our stack">
        <LegalList>
          <li>
            <strong>Maps:</strong> vector tiles and styles from{" "}
            <a
              className={styles.legalInlineLink}
              href="https://openfreemap.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenFreeMap
            </a>{" "}
            and geographic data from{" "}
            <a
              className={styles.legalInlineLink}
              href="https://www.openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenStreetMap
            </a>{" "}
            contributors.
          </li>
          <li>
            <strong>Backend:</strong>{" "}
            <a
              className={styles.legalInlineLink}
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase
            </a>{" "}
            (open source) for authentication and data storage in the EU.
          </li>
          <li>
            <strong>Analytics:</strong>{" "}
            <a
              className={styles.legalInlineLink}
              href="https://umami.is"
              target="_blank"
              rel="noopener noreferrer"
            >
              Umami
            </a>{" "}
            — privacy-focused, cookieless usage metrics without ad tracking.
          </li>
          <li>
            <strong>Error reporting:</strong>{" "}
            <a
              className={styles.legalInlineLink}
              href="https://www.bugsink.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bugsink
            </a>{" "}
            — self-hostable error tracking hosted in the EU to help us fix
            crashes without profiling you.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Licences and attribution">
        <LegalParagraph>
          Curolia bundles many open source libraries and map data sources. The
          summary and full dependency list live on our{" "}
          <LegalNavLink
            target="licenses"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            open source licenses
          </LegalNavLink>{" "}
          page.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Related">
        <LegalParagraph>
          See also our{" "}
          <LegalNavLink
            target="privacy"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Privacy Policy
          </LegalNavLink>
          ,{" "}
          <LegalNavLink
            target="terms"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Terms and Conditions
          </LegalNavLink>
          , and{" "}
          <LegalNavLink
            target="contact"
            embedded={embedded}
            onNavigate={onNavigate}
          >
            Contact
          </LegalNavLink>
          .
        </LegalParagraph>
      </LegalSection>
    </>
  );
}
