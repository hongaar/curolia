import { OpenSourceMindsetContent } from "../content/legal-content";
import { MarketingDocumentPage } from "../shell/marketing-shell";

const EFFECTIVE_DATE = "10 June 2026";

export function OpenSourceMindsetPageContent({
  logoSrc = "/icon.png",
  githubUrl = "https://github.com/hongaar/curolia",
}: {
  logoSrc?: string;
  githubUrl?: string;
}) {
  return (
    <MarketingDocumentPage
      title="Open source at Curolia"
      effectiveDate={EFFECTIVE_DATE}
      logoSrc={logoSrc}
    >
      <OpenSourceMindsetContent githubUrl={githubUrl} />
    </MarketingDocumentPage>
  );
}
