import { PrivacyPolicyContent, TermsContent } from "../content/legal-content";
import { MarketingDocumentPage } from "../shell/marketing-shell";

const EFFECTIVE_DATE = "10 June 2026";

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
