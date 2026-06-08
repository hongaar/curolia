import type * as React from "react";

import { cn } from "../../lib/utils";
import { Card } from "../card";
import styles from "./page.module.css";

export function Page({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(styles.page, className)}>{children}</div>;
}

export function PageScroll({
  children,
  underNav = false,
}: {
  children: React.ReactNode;
  underNav?: boolean;
}) {
  return (
    <div className={underNav ? styles.scrollUnderNav : styles.scroll}>
      {children}
    </div>
  );
}

export function PageContentStack({
  children,
  width = "narrow",
}: {
  children: React.ReactNode;
  width?: "narrow" | "default" | "wide" | "2xl";
}) {
  return (
    <div
      className={cn(
        styles.contentStack,
        width === "narrow" && styles.contentStackNarrow,
        width === "default" && styles.contentStackWide,
        width === "wide" && styles.contentStackWide,
        width === "2xl" && styles.contentStack2xl,
      )}
    >
      {children}
    </div>
  );
}

export function AppPageLayout({
  children,
  width = "narrow",
}: {
  children: React.ReactNode;
  width?: "narrow" | "default" | "wide" | "2xl";
}) {
  return (
    <Page>
      <PageScroll underNav>
        <PageContentStack width={width}>{children}</PageContentStack>
      </PageScroll>
    </Page>
  );
}

export function PageContent({
  children,
  width = "default",
  className,
}: {
  children: React.ReactNode;
  width?: "default" | "wide" | "narrow";
  className?: string;
}) {
  return (
    <div
      className={cn(
        styles.content,
        width === "wide" && styles.contentWide,
        width === "narrow" && styles.contentNarrow,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <header className={cn(styles.header, className)}>{children}</header>;
}

export function PageHeaderRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.headerRow}>{children}</div>;
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className={styles.title}>{children}</h1>;
}

export function PageDisplayTitle({ children }: { children: React.ReactNode }) {
  return <h1 className={styles.displayTitle}>{children}</h1>;
}

export function PageLead({ children }: { children: React.ReactNode }) {
  return <p className={styles.lead}>{children}</p>;
}

export function PagePanel({ children }: { children: React.ReactNode }) {
  return <Card surface="page">{children}</Card>;
}

export function PageSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(styles.section, className)}>{children}</section>
  );
}

export function PageSectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.sectionTitle}>{children}</h2>;
}

export function PageMuted({ children }: { children: React.ReactNode }) {
  return <p className={styles.muted}>{children}</p>;
}

export function PageGrid2({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid2}>{children}</div>;
}

export function PageFab({ children }: { children: React.ReactNode }) {
  return <div className={styles.fab}>{children}</div>;
}

export function PageSectionSpaced({
  children,
  large = false,
}: {
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <section className={large ? styles.sectionSpacedLg : styles.sectionSpaced}>
      {children}
    </section>
  );
}

export function PageSectionHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return <h2 className={styles.sectionHeading}>{children}</h2>;
}

export function PageSectionSubheading({
  children,
}: {
  children: React.ReactNode;
}) {
  return <h3 className={styles.sectionSubheading}>{children}</h3>;
}

export function PageSectionHint({ children }: { children: React.ReactNode }) {
  return <p className={styles.sectionHint}>{children}</p>;
}

export function PageInlineActions({
  children,
  spaced = "default",
}: {
  children: React.ReactNode;
  spaced?: "default" | "tight" | "none";
}) {
  return (
    <div
      className={
        spaced === "tight"
          ? `${styles.inlineActions} ${styles.inlineActionsTight}`
          : spaced === "none"
            ? styles.inlineActions
            : `${styles.inlineActions} ${styles.inlineActionsSpaced}`
      }
    >
      {children}
    </div>
  );
}

export function PageSwitchRow({
  label,
  hint,
  control,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  control: React.ReactNode;
}) {
  return (
    <div className={styles.switchRow}>
      <div className={styles.switchRowText}>
        <div className={styles.switchRowLabel}>{label}</div>
        {hint ? <p className={styles.switchRowHint}>{hint}</p> : null}
      </div>
      {control}
    </div>
  );
}

export function PageSwitchStack({ children }: { children: React.ReactNode }) {
  return <div className={styles.switchStack}>{children}</div>;
}

export function PageProfileGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.profileGrid}>{children}</div>;
}

export function PageAvatarSection({ children }: { children: React.ReactNode }) {
  return <div className={styles.avatarSection}>{children}</div>;
}

export function PageAvatarRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.avatarRow}>{children}</div>;
}

export function PageAvatarActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.avatarActions}>{children}</div>;
}

export function PageAvatarHint({ children }: { children: React.ReactNode }) {
  return <p className={styles.avatarHint}>{children}</p>;
}

export function PageExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className={styles.externalLink}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

export function PageEmailLine({
  children,
  highlight,
}: {
  children?: React.ReactNode;
  highlight?: React.ReactNode;
}) {
  return (
    <p className={styles.emailLine}>
      {children}
      {highlight ? (
        <span className={styles.emailHighlight}>{highlight}</span>
      ) : null}
    </p>
  );
}

export function PageCenteredLoading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Page>
      <PageScroll underNav>
        <div className={styles.centeredLoading}>
          <p className={styles.muted}>{children}</p>
        </div>
      </PageScroll>
    </Page>
  );
}

export function PageCenteredError({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Page>
      <PageScroll underNav>
        <div className={styles.centeredError}>
          <p className={styles.muted}>{children}</p>
          {actions}
        </div>
      </PageScroll>
    </Page>
  );
}

export function PagePanelTitleLg({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.panelTitleLg}>{children}</h2>;
}

export function PagePanelTitleRow({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className={`${styles.panelTitleLg} ${styles.panelTitleRow}`}>
      {icon}
      {children}
    </h2>
  );
}

export function PagePanelIcon({ children }: { children: React.ReactNode }) {
  return <span className={styles.panelTitleIcon}>{children}</span>;
}

export function PagePanelHeaderBlock({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.panelHeaderBlock}>{children}</div>;
}

export function PageFormBlockSpaced({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.formBlockSpaced}>{children}</div>;
}

export function PageErrorText({ children }: { children: React.ReactNode }) {
  return <p className={styles.errorText}>{children}</p>;
}

export function PageErrorTextSpaced({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className={styles.errorTextSpaced}>{children}</p>;
}

export function PageMessageText({ children }: { children: React.ReactNode }) {
  return <p className={styles.messageText}>{children}</p>;
}

export function PageCapitalize({ children }: { children: React.ReactNode }) {
  return <span className={styles.capitalize}>{children}</span>;
}

export function PageFitButton({ children }: { children: React.ReactNode }) {
  return <div className={styles.fitButton}>{children}</div>;
}

export function PageInviteRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.inviteRow}>{children}</div>;
}

export function PageInviteEmailField({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.inviteEmailField}>{children}</div>;
}

export function PageInviteRoleField({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.inviteRoleField}>{children}</div>;
}

export function PageSharingRoot({ children }: { children: React.ReactNode }) {
  return <div className={styles.sharingRoot}>{children}</div>;
}

export function PageSharingSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.sharingSection}>{children}</div>;
}

export const pageStyles = styles;
