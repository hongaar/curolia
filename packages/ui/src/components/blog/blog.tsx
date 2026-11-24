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

/** Small-viewport row at the top of `BlogScroll`, aligned beside the fixed
 *  toolbar brand; scrolls away with the content. Hidden on wider viewports. */
export function BlogScrollToolbarRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.scrollToolbarRow}>{children}</div>;
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
  hidden = false,
}: {
  avatar: React.ReactNode;
  name: React.ReactNode;
  /** When set, the author name links to their public profile. */
  nameHref?: string;
  /** Optional short profile bio; omitted when empty. */
  bio?: React.ReactNode;
  /** `floating` uses frosted panel styling for map overlays. */
  surface?: "default" | "floating";
  /** Floating only: slides the card out to the left (kept mounted so it can animate back in). */
  hidden?: boolean;
}) {
  return (
    <div
      className={cn(
        styles.authorCard,
        surface === "floating" && styles.authorCardFloating,
        surface === "floating" && hidden && styles.authorCardFloatingHidden,
      )}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
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

type BlogPinTitleAccentProps = {
  /** Hover/active color (e.g. tag color); lightness is clamped for contrast. Defaults to primary. */
  accentColor?: string;
  /** Selected pin: title stays in the accent color without underline. */
  active?: boolean;
};

function pinTitleAccentProps({ accentColor, active }: BlogPinTitleAccentProps) {
  return {
    className: styles.pinTitleLink,
    "data-active": active ? "true" : undefined,
    style: accentColor
      ? ({ "--blog-pin-accent": accentColor } as React.CSSProperties)
      : undefined,
  };
}

export function BlogPinTitleLink({
  to,
  children,
  accentColor,
  active,
}: {
  to: string;
  children: React.ReactNode;
} & BlogPinTitleAccentProps) {
  return (
    <Link to={to} {...pinTitleAccentProps({ accentColor, active })}>
      {children}
    </Link>
  );
}

export function BlogPinTitleButton({
  children,
  accentColor,
  active,
  ...props
}: Omit<React.ComponentProps<"button">, "className" | "style"> &
  BlogPinTitleAccentProps) {
  return (
    <button
      type="button"
      {...props}
      {...pinTitleAccentProps({ accentColor, active })}
    >
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
