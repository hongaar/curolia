import type * as React from "react";

import styles from "./landing-page.module.css";
import { OpenSourceLicensesSummaryContent } from "./legal-content";
import { MarketingDocumentPage } from "./marketing-shell";

const EFFECTIVE_DATE = "1 June 2026";

export function OpenSourceLicensesPageContent({
  logoSrc = "/icon.png",
  npmLicenses,
}: {
  logoSrc?: string;
  /** Full generated npm licence list (from apps/web codegen). */
  npmLicenses?: React.ReactNode;
}) {
  return (
    <MarketingDocumentPage
      title="Open source licenses"
      effectiveDate={EFFECTIVE_DATE}
      logoSrc={logoSrc}
    >
      <OpenSourceLicensesSummaryContent />
      {npmLicenses ? (
        <section id="npm" className={styles.legalSection}>
          <h2 className={styles.legalSectionTitle}>Dependency licences</h2>
          {npmLicenses}
        </section>
      ) : null}
    </MarketingDocumentPage>
  );
}
