import { UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "../../lib/utils";
import styles from "./user-avatar.module.css";

/** 0 = custom URL, 1 = Gravatar, 2 = give up (placeholder). */
type Attempt = 0 | 1 | 2;

/** `xs` 1.25rem · `sm` 2rem · `md` 2rem · `lg` 6rem · `full` fills the parent. */
export type UserAvatarSize = "xs" | "sm" | "md" | "lg" | "full";

export type UserAvatarProps = {
  /** User-uploaded avatar URL; tried before Gravatar. */
  storedAvatarUrl: string | null | undefined;
  /** Account email for Gravatar fallback and alt text. */
  email: string | null | undefined;
  /** Optional precomputed Gravatar URL. */
  gravatarUrl?: string | null;
  /** Display size token. */
  size?: UserAvatarSize;
  /** Accessible name when the image is decorative. */
  label?: string;
  /** Notification dot overlay. */
  showUnreadDot?: boolean;
};

export function UserAvatar({
  storedAvatarUrl,
  email,
  gravatarUrl = null,
  size = "md",
  label = "",
  showUnreadDot = false,
}: UserAvatarProps) {
  const stored = storedAvatarUrl?.trim() || null;
  const [attempt, setAttempt] = useState<Attempt>(() => (stored ? 0 : 1));

  useEffect(() => {
    setAttempt(stored ? 0 : 1);
  }, [stored, email]);

  const tryStored = attempt === 0;
  const tryGravatar = attempt === 1;
  const src =
    tryStored && stored
      ? stored
      : tryGravatar && gravatarUrl
        ? gravatarUrl
        : null;

  const placeholderClass = cn(
    styles.placeholder,
    size === "xs" && styles.placeholderXs,
    size === "sm" && styles.placeholderSm,
    size === "md" && styles.placeholderMd,
    size === "lg" && styles.placeholderLg,
    size === "full" && styles.placeholderFull,
  );

  const imageWrapClass = cn(
    styles.imageWrap,
    size === "xs" && styles.imageWrapXs,
    size === "sm" && styles.imageWrapSm,
    size === "md" && styles.imageWrapMd,
    size === "lg" && styles.imageWrapLg,
    size === "full" && styles.imageWrapFull,
  );

  const imageClass = cn(
    styles.image,
    size === "xs" && styles.imageXs,
    size === "sm" && styles.imageSm,
    size === "md" && styles.imageMd,
    size === "lg" && styles.imageLg,
    size === "full" && styles.imageFull,
  );

  const iconClass = cn(
    size === "xs" && styles.iconXs,
    size === "sm" && styles.iconSm,
    size === "md" && styles.iconMd,
    size === "lg" && styles.iconLg,
    size === "full" && styles.iconFull,
  );

  const inner = !src ? (
    <span className={placeholderClass} aria-hidden>
      <UserCircle className={iconClass} />
    </span>
  ) : (
    <span className={imageWrapClass}>
      <img
        src={src}
        alt={label}
        className={imageClass}
        referrerPolicy="no-referrer"
        onError={() => {
          setAttempt((a) => (a < 2 ? ((a + 1) as Attempt) : 2));
        }}
      />
    </span>
  );

  if (!showUnreadDot) {
    return (
      <span className={cn(styles.root, size === "full" && styles.rootFull)}>
        {inner}
      </span>
    );
  }

  return (
    <span className={cn(styles.root, size === "full" && styles.rootFull)}>
      {inner}
      <span className={styles.unreadDot} aria-hidden />
    </span>
  );
}
