import { OpenSourceMindsetContent } from "../content/legal-content";
import { MarketingDocumentPage } from "../shell/marketing-shell";

export function OpenSourceMindsetPageContent({
  logoSrc = "/icon.png",
  githubUrl = "https://github.com/hongaar/curolia",
}: {
  logoSrc?: string;
  githubUrl?: string;
}) {
  return (
    <MarketingDocumentPage title="Open source at Curolia" logoSrc={logoSrc}>
      <OpenSourceMindsetContent githubUrl={githubUrl} />
    </MarketingDocumentPage>
  );
}
