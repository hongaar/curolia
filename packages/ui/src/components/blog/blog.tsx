import * as React from "react";
import { Link } from "react-router";

import { cn } from "../../lib/utils";
import { CardMeta } from "../card-meta";
import { MarkdownContent } from "../markdown-content";
import styles from "./blog.module.css";

export function BlogPageRoot({ children }: { children: React.ReactNode }) {
  return <div className={styles.root}>{children}</div>;
}

export function BlogFabSlot({ children }: { children: React.ReactNode }) {
  return <div className={styles.fabSlot}>{children}</div>;
}

export function BlogScroll({
  children,
  ref,
}: {
  children: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className={styles.scroll}>
      {children}
    </div>
  );
}

export function BlogContent({ children }: { children: React.ReactNode }) {
  return <div className={styles.content}>{children}</div>;
}

export function BlogFullWidthContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.fullWidthContent}>{children}</div>;
}

export function BlogAuthorCard({
  avatar,
  name,
  nameHref,
  bio,
  surface = "default",
}: {
  avatar: React.ReactNode;
  name: React.ReactNode;
  /** When set, the author name links to their public profile. */
  nameHref?: string;
  /** Optional short profile bio; omitted when empty. */
  bio?: React.ReactNode;
  /** `floating` uses frosted panel styling for map overlays. */
  surface?: "default" | "floating";
}) {
  return (
    <div
      className={cn(
        styles.authorCard,
        surface === "floating" && styles.authorCardFloating,
      )}
    >
      <div className={styles.authorAvatar}>{avatar}</div>
      <div className={styles.authorIdentity}>
        <p className={styles.authorEyebrow}>Author</p>
        <p className={styles.authorName}>
          {nameHref ? (
            <Link className={styles.authorNameLink} to={nameHref}>
              {name}
            </Link>
          ) : (
            name
          )}
        </p>
      </div>
      {bio ? <p className={styles.authorBio}>{bio}</p> : null}
    </div>
  );
}

export function BlogHeader({ children }: { children: React.ReactNode }) {
  return <header className={styles.header}>{children}</header>;
}

export function BlogKicker({ children }: { children: React.ReactNode }) {
  return <p className={styles.kicker}>{children}</p>;
}

export function BlogTitle({ children }: { children: React.ReactNode }) {
  return <h1 className={styles.title}>{children}</h1>;
}

export function BlogLead({ children }: { children: React.ReactNode }) {
  return <p className={styles.lead}>{children}</p>;
}

export function BlogSortTrigger({
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button type="button" className={styles.sortTrigger} {...props}>
      {children}
    </button>
  );
}

export function BlogSortLabel({ children }: { children: React.ReactNode }) {
  return <span className={styles.sortLabel}>{children}</span>;
}

export function BlogSortChevron({ children }: { children: React.ReactNode }) {
  return <span className={styles.sortChevron}>{children}</span>;
}

export function BlogEmptyPanel({ children }: { children: React.ReactNode }) {
  return <div className={styles.emptyPanel}>{children}</div>;
}

export function BlogPinList({ children }: { children: React.ReactNode }) {
  return <ul className={styles.pinList}>{children}</ul>;
}

export function BlogPinDate({
  dateTime,
  children,
}: {
  dateTime?: string;
  children: React.ReactNode;
}) {
  return (
    <time className={styles.pinDate} dateTime={dateTime}>
      {children}
    </time>
  );
}

export function BlogPinTitle({
  children,
  spaced = false,
}: {
  children: React.ReactNode;
  spaced?: boolean;
}) {
  return (
    <h2
      className={
        spaced ? `${styles.pinTitle} ${styles.pinTitleSpaced}` : styles.pinTitle
      }
    >
      {children}
    </h2>
  );
}

export function BlogPinTitleLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link className={styles.pinTitleLink} to={to}>
      {children}
    </Link>
  );
}

export function BlogPinTitleButton({
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button type="button" className={styles.pinTitleLink} {...props}>
      {children}
    </button>
  );
}

export const blogStyles = styles;

export function BlogTagRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.tagRow}>{children}</div>;
}

export function BlogPinDescription({ markdown }: { markdown: string }) {
  return (
    <MarkdownContent className={styles.pinDescription} markdown={markdown} />
  );
}

export function BlogPinGallery({ children }: { children: React.ReactNode }) {
  return <div className={styles.pinGallery}>{children}</div>;
}

export function BlogPinCardMeta({ children }: { children: React.ReactNode }) {
  return (
    <CardMeta inset={false} className={styles.pinMeta}>
      {children}
    </CardMeta>
  );
}

export function BlogPinActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.pinActions}>{children}</div>;
}
