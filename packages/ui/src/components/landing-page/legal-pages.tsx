import { PrivacyPolicyContent, TermsContent } from "./legal-content";
import { MarketingDocumentPage } from "./marketing-shell";

const EFFECTIVE_DATE = "31 May 2026";

export function PrivacyPolicyPageContent({
  logoSrc = "/icon.png",
  contactEmail = "hello@curolia.com",
}: {
  logoSrc?: string;
  contactEmail?: string;
}) {
  return (
    <MarketingDocumentPage
      title="Privacy Policy"
      effectiveDate={EFFECTIVE_DATE}
      logoSrc={logoSrc}
    >
      <PrivacyPolicyContent contactEmail={contactEmail} />
    </MarketingDocumentPage>
  );
}

export function TermsPageContent({
  logoSrc = "/icon.png",
  contactEmail = "hello@curolia.com",
}: {
  logoSrc?: string;
  contactEmail?: string;
}) {
  return (
    <MarketingDocumentPage
      title="Terms and Conditions"
      effectiveDate={EFFECTIVE_DATE}
      logoSrc={logoSrc}
    >
      <TermsContent contactEmail={contactEmail} />
    </MarketingDocumentPage>
  );
}

export {
  ContactContent,
  OpenSourceLicensesSummaryContent,
  PrivacyPolicyContent,
  TermsContent,
} from "./legal-content";
export type { LegalContentProps, LegalNavTarget } from "./legal-content";
