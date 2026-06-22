import type * as React from "react";
import { Link } from "react-router-dom";

import { cn } from "@curolia/ui";
import { buttonClassName } from "@curolia/ui/button";
import styles from "../styles/site.module.css";

type MarketingLinkProps = {
  to: string;
  children: React.ReactNode;
  className?: string;
};

function MarketingLink({ to, children, className }: MarketingLinkProps) {
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}

export function MarketingButtonLink({
  to,
  children,
  variant = "default",
  size = "default",
  rounded = false,
  className,
}: {
  to: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "accent";
  size?: "default" | "sm" | "lg";
  rounded?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={buttonClassName({
        variant,
        size,
        rounded,
        className: cn(styles.buttonLink, className),
      })}
    >
      {children}
    </Link>
  );
}

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.backdrop} aria-hidden />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export function MarketingHeader({
  logoSrc = "/icon.png",
}: {
  logoSrc?: string;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.headerStart}>
          <MarketingLink to="/" className={styles.brand}>
            <img
              className={styles.brandLogo}
              src={logoSrc}
              alt=""
              width={36}
              height={36}
              decoding="async"
            />
            <p className={styles.brandName}>Curolia</p>
          </MarketingLink>
        </div>

        <div className={styles.headerActions}>
          <MarketingButtonLink to="/login" variant="ghost">
            Log in
          </MarketingButtonLink>
          <MarketingButtonLink to="/signup">Sign up</MarketingButtonLink>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerLinks}>
          <MarketingLink to="/privacy" className={styles.footerLink}>
            Privacy
          </MarketingLink>
          <MarketingLink to="/terms" className={styles.footerLink}>
            Terms
          </MarketingLink>
          <MarketingLink to="/contact" className={styles.footerLink}>
            Contact
          </MarketingLink>
          <MarketingLink to="/open-source" className={styles.footerLink}>
            Open source
          </MarketingLink>
          <MarketingLink to="/licenses" className={styles.footerLink}>
            Licenses
          </MarketingLink>
          <MarketingLink to="/login" className={styles.footerLink}>
            Log in
          </MarketingLink>
          <MarketingLink to="/signup" className={styles.footerLink}>
            Sign up
          </MarketingLink>
        </div>
        <p className={styles.footerNote}>
          Curolia — Remember every place you go
        </p>
      </div>
    </footer>
  );
}

export function MarketingDocumentPage({
  title,
  effectiveDate,
  logoSrc = "/icon.png",
  children,
}: {
  title: string;
  effectiveDate: string;
  logoSrc?: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingLayout>
      <MarketingHeader logoSrc={logoSrc} />
      <main className={styles.legalPage}>
        <article className={styles.legalPanel}>
          <h1 className={styles.legalTitle}>{title}</h1>
          <p className={styles.legalEffective}>Last updated: {effectiveDate}</p>
          <div className={styles.legalBody}>{children}</div>
        </article>
      </main>
      <MarketingFooter />
    </MarketingLayout>
  );
}
