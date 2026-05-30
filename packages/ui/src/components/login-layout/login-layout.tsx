import type * as React from "react";

import { TabsContent, TabsList, TabsTrigger } from "../tabs";
import { Stack } from "../stack";
import { Text } from "../text";
import { FloatingPanel } from "../floating-panel";
import styles from "./login-layout.module.css";

export type LoginLayoutProps = {
  children: React.ReactNode;
  backdropStyle?: React.CSSProperties;
};

export function LoginLayout({ children, backdropStyle }: LoginLayoutProps) {
  return (
    <div className={styles.page}>
      <div
        className={styles.backdrop}
        style={
          backdropStyle ?? {
            background: `
            radial-gradient(ellipse 120% 80% at 20% 20%, oklch(0.55 0.08 158 / 0.18), transparent 50%),
            radial-gradient(ellipse 100% 60% at 80% 70%, oklch(0.55 0.06 250 / 0.14), transparent 45%),
            linear-gradient(165deg, oklch(0.94 0.02 88) 0%, oklch(0.9 0.025 95) 100%)
          `,
          }
        }
        aria-hidden
      />
      <FloatingPanel padding="lg" elevated className={styles.panel}>
        {children}
      </FloatingPanel>
    </div>
  );
}

export function LoginHeader({
  title = "Curolia",
  subtitle = "Sign in to your travel journal.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className={styles.header}>
      <Text
        as="h1"
        variant={["display", "titleLg", "center"]}
        className={styles.headerTitle}
      >
        {title}
      </Text>
      <Text variant={["muted", "center"]} className={styles.headerSubtitle}>
        {subtitle}
      </Text>
    </div>
  );
}

export function LoginFormStack({ children }: { children: React.ReactNode }) {
  return (
    <Stack gap="md" className={styles.formSection}>
      {children}
    </Stack>
  );
}

export function LoginField({ children }: { children: React.ReactNode }) {
  return <div className={styles.field}>{children}</div>;
}

export function LoginError({ children }: { children: React.ReactNode }) {
  return <p className={styles.error}>{children}</p>;
}

export function LoginActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}

export function LoginTabsList({ children }: { children: React.ReactNode }) {
  return <TabsList className={styles.tabsList}>{children}</TabsList>;
}

export function LoginTabTrigger({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger value={value} className={styles.tabTrigger}>
      {children}
    </TabsTrigger>
  );
}

export function LoginTabPanel({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContent value={value}>
      <LoginFormStack>{children}</LoginFormStack>
    </TabsContent>
  );
}

export function LoginFooterNote({ children }: { children: React.ReactNode }) {
  return <p className={styles.footerNote}>{children}</p>;
}

export function LoginInlineCode({ children }: { children: React.ReactNode }) {
  return <code className={styles.inlineCode}>{children}</code>;
}

export function loginTabsListClassName() {
  return styles.tabsList;
}

export function loginTabTriggerClassName() {
  return styles.tabTrigger;
}
