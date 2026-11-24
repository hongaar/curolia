import { PrivacyPolicyContent, TermsContent } from "../content/legal-content";
import { MarketingDocumentPage } from "../shell/marketing-shell";

export function PrivacyPolicyPageContent({
  logoSrc = "/icon.png",
  contactEmail = "hello@curolia.com",
}: {
  logoSrc?: string;
  contactEmail?: string;
}) {
  return (
    <MarketingDocumentPage title="Privacy Policy" logoSrc={logoSrc}>
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
    <MarketingDocumentPage title="Terms and Conditions" logoSrc={logoSrc}>
      <TermsContent contactEmail={contactEmail} />
    </MarketingDocumentPage>
  );
}
