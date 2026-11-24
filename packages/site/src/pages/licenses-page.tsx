import type * as React from "react";

import { OpenSourceLicensesSummaryContent } from "../content/legal-content";
import { MarketingDocumentPage } from "../shell/marketing-shell";

export function OpenSourceLicensesPageContent({
  logoSrc = "/icon.png",
  npmLicenses,
}: {
  logoSrc?: string;
  /** Full generated npm licence list (from apps/web codegen). */
  npmLicenses?: React.ReactNode;
}) {
  return (
    <MarketingDocumentPage title="Open source licenses" logoSrc={logoSrc}>
      <OpenSourceLicensesSummaryContent npmLicenses={npmLicenses} />
    </MarketingDocumentPage>
  );
}
