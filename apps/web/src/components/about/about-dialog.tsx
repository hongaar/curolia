import { NpmLicensesFullList } from "@/components/about/npm-licenses-full-list";
import {
  ContactContent,
  LegalEmbed,
  OpenSourceLicensesSummaryContent,
  OpenSourceMindsetContent,
  PrivacyPolicyContent,
  TermsContent,
  type LegalNavTarget,
} from "@curolia/site/content";
import {
  AboutDialogShell,
  AboutLinkList,
  AboutMapAttributionSection,
  AboutVersionMeta,
} from "@curolia/ui/about-dialog";
import { useState, type ReactNode } from "react";

export type AboutView =
  | "main"
  | "contact"
  | "privacy"
  | "terms"
  | "openSource"
  | "licenses";

const VIEW_TITLES: Record<AboutView, string> = {
  main: "About Curolia",
  contact: "Contact",
  privacy: "Privacy Policy",
  terms: "Terms and Conditions",
  openSource: "Open source at Curolia",
  licenses: "Open source licenses",
};

const ABOUT_LINKS = [
  { id: "contact", label: "Contact" },
  { id: "terms", label: "Terms and Conditions" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "openSource", label: "Open source at Curolia" },
  { id: "licenses", label: "Open source licenses" },
] as const;

export type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
  contactEmail?: string;
  npmLicensesContent?: ReactNode;
};

export function AboutDialog({
  open,
  onOpenChange,
  version,
  contactEmail = "hello@curolia.com",
  npmLicensesContent = <NpmLicensesFullList />,
}: AboutDialogProps) {
  const [view, setView] = useState<AboutView>("main");

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setView("main");
  };

  const legalProps = {
    contactEmail,
    embedded: true as const,
    onNavigate: (target: LegalNavTarget) => {
      const map: Record<LegalNavTarget, AboutView> = {
        contact: "contact",
        privacy: "privacy",
        terms: "terms",
        openSource: "openSource",
        licenses: "licenses",
      };
      setView(map[target]);
    },
  };

  const panel =
    view === "main" ? undefined : (
      <LegalEmbed>
        {view === "contact" ? <ContactContent {...legalProps} /> : null}
        {view === "privacy" ? <PrivacyPolicyContent {...legalProps} /> : null}
        {view === "terms" ? <TermsContent {...legalProps} /> : null}
        {view === "openSource" ? (
          <OpenSourceMindsetContent {...legalProps} />
        ) : null}
        {view === "licenses" ? (
          <OpenSourceLicensesSummaryContent
            {...legalProps}
            npmLicenses={npmLicensesContent}
          />
        ) : null}
      </LegalEmbed>
    );

  return (
    <AboutDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      title={VIEW_TITLES[view]}
      onBack={view !== "main" ? () => setView("main") : undefined}
      main={
        <>
          <AboutVersionMeta version={version} />
          <AboutLinkList
            items={[...ABOUT_LINKS]}
            onSelect={(id) => setView(id as AboutView)}
          />
          <AboutMapAttributionSection />
        </>
      }
      panel={panel}
    />
  );
}
