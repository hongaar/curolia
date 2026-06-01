import { ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Dialog } from "../dialog";
import type { LegalNavTarget } from "../landing-page/legal-content";
import {
  ContactContent,
  LegalEmbed,
  OpenSourceLicensesSummaryContent,
  PrivacyPolicyContent,
  TermsContent,
} from "../landing-page/legal-content";
import { PageBackButton } from "../page-back-button";
import { PanelDialogContent, PanelDialogTitle } from "../panel-dialog";
import styles from "./about-dialog.module.css";
import { MapAttributionInline } from "./map-attribution";

export type AboutView =
  | "main"
  | "contact"
  | "privacy"
  | "terms"
  | "licenses"
  | "licenses-full";

const VIEW_TITLES: Record<AboutView, string> = {
  main: "About Curolia",
  contact: "Contact",
  privacy: "Privacy Policy",
  terms: "Terms and Conditions",
  licenses: "Open source licenses",
  "licenses-full": "Dependency licences",
};

export type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
  contactEmail?: string;
  /** Full npm licence list (generated in apps/web). */
  npmLicensesContent?: ReactNode;
};

export function AboutDialog({
  open,
  onOpenChange,
  version,
  contactEmail = "hello@curolia.com",
  npmLicensesContent,
}: AboutDialogProps) {
  const [view, setView] = useState<AboutView>("main");

  useEffect(() => {
    if (!open) setView("main");
  }, [open]);

  const legalProps = {
    contactEmail,
    embedded: true as const,
    onNavigate: (target: LegalNavTarget) => {
      const map: Record<LegalNavTarget, AboutView> = {
        contact: "contact",
        privacy: "privacy",
        terms: "terms",
        licenses: "licenses",
      };
      setView(map[target]);
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <PanelDialogContent size="md">
        {view !== "main" ? (
          <div className={styles.backRow}>
            <PageBackButton onClick={() => setView("main")} label="About" />
          </div>
        ) : null}
        <PanelDialogTitle>{VIEW_TITLES[view]}</PanelDialogTitle>
        <div
          className={
            view === "main"
              ? styles.body
              : `${styles.body} ${styles.scrollBody}`
          }
        >
          {view === "main" ? (
            <>
              <div className={styles.meta}>
                <span className={styles.versionLabel}>Version</span>
                <span className={styles.versionValue}>{version}</span>
              </div>

              <nav className={styles.linksNav} aria-label="About links">
                <ul className={styles.links}>
                  {(
                    [
                      ["contact", "Contact"],
                      ["terms", "Terms and Conditions"],
                      ["privacy", "Privacy Policy"],
                      ["licenses", "Open source licenses"],
                    ] as const
                  ).map(([id, label]) => (
                    <li key={id} className={styles.linkItem}>
                      <button
                        type="button"
                        className={styles.link}
                        onClick={() => setView(id)}
                      >
                        {label}
                        <ChevronRight
                          className={styles.linkChevron}
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              <section className={styles.section} aria-label="Map attribution">
                <h3 className={styles.sectionTitle}>Map data</h3>
                <MapAttributionInline />
              </section>
            </>
          ) : (
            <LegalEmbed>
              {view === "contact" ? <ContactContent {...legalProps} /> : null}
              {view === "privacy" ? (
                <PrivacyPolicyContent {...legalProps} />
              ) : null}
              {view === "terms" ? <TermsContent {...legalProps} /> : null}
              {view === "licenses" ? (
                <OpenSourceLicensesSummaryContent
                  {...legalProps}
                  onShowFullLicenseList={() => setView("licenses-full")}
                />
              ) : null}
              {view === "licenses-full" ? npmLicensesContent : null}
            </LegalEmbed>
          )}
        </div>
      </PanelDialogContent>
    </Dialog>
  );
}

export { MapAttributionInline } from "./map-attribution";
export { NpmLicensesList, type NpmLicenseEntry } from "./npm-licenses-list";
