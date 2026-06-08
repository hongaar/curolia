import type { ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../dialog";
import styles from "./onboarding.module.css";

export type OnboardingTone = "brand" | "sky" | "amber" | "violet" | "rose";

const toneClass: Record<OnboardingTone, string> = {
  brand: styles.toneBrand,
  sky: styles.toneSky,
  amber: styles.toneAmber,
  violet: styles.toneViolet,
  rose: styles.toneRose,
};

export function OnboardingDialog({
  open,
  onOpenChange,
  tone = "brand",
  "aria-label": ariaLabel,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tone?: OnboardingTone;
  "aria-label"?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(styles.content, toneClass[tone])}
        aria-label={ariaLabel}
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function OnboardingHero({
  icon,
  onSkip,
  skipLabel = "Skip",
}: {
  icon: ReactNode;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  return (
    <div className={styles.hero}>
      {onSkip ? (
        <Button
          variant="ghost"
          size="sm"
          className={styles.skip}
          onClick={onSkip}
        >
          {skipLabel}
        </Button>
      ) : null}
      <span className={styles.heroChip} aria-hidden>
        {icon}
      </span>
    </div>
  );
}

export function OnboardingBody({ children }: { children: ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}

export function OnboardingEyebrow({ children }: { children: ReactNode }) {
  return <span className={styles.eyebrow}>{children}</span>;
}

export function OnboardingTitle({ children }: { children: ReactNode }) {
  return <DialogTitle className={styles.title}>{children}</DialogTitle>;
}

export function OnboardingDescription({ children }: { children: ReactNode }) {
  return (
    <DialogDescription className={styles.description}>
      {children}
    </DialogDescription>
  );
}

export function OnboardingFeatureGrid({ children }: { children: ReactNode }) {
  return <div className={styles.featureGrid}>{children}</div>;
}

export function OnboardingFeatureItem({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.featureItem}>
      <span className={styles.featureIcon} aria-hidden>
        {icon}
      </span>
      <span className={styles.featureTitle}>{title}</span>
      <span className={styles.featureText}>{children}</span>
    </div>
  );
}

export function OnboardingPluginList({ children }: { children: ReactNode }) {
  return <div className={styles.pluginList}>{children}</div>;
}

export function OnboardingPluginRow({
  icon,
  name,
  children,
}: {
  icon: ReactNode;
  name: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={styles.pluginRow}>
      <span className={styles.pluginIcon} aria-hidden>
        {icon}
      </span>
      <span className={styles.pluginInfo}>
        <span className={styles.pluginName}>{name}</span>
        {children ? (
          <span className={styles.pluginText}>{children}</span>
        ) : null}
      </span>
    </div>
  );
}

export function OnboardingFooter({
  total,
  current,
  onSelectStep,
  children,
}: {
  total: number;
  current: number;
  onSelectStep?: (index: number) => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.footer}>
      <OnboardingProgress
        total={total}
        current={current}
        onSelectStep={onSelectStep}
      />
      <div className={styles.footerEnd}>{children}</div>
    </div>
  );
}

function OnboardingProgress({
  total,
  current,
  onSelectStep,
}: {
  total: number;
  current: number;
  onSelectStep?: (index: number) => void;
}) {
  return (
    <div
      className={styles.progress}
      role="tablist"
      aria-label="Onboarding steps"
    >
      {Array.from({ length: total }, (_, index) => {
        const isActive = index === current;
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Step ${index + 1} of ${total}`}
            className={cn(
              styles.dot,
              isActive && styles.dotActive,
              index < current && styles.dotDone,
            )}
            disabled={!onSelectStep}
            onClick={onSelectStep ? () => onSelectStep(index) : undefined}
          />
        );
      })}
    </div>
  );
}
