import { getGravatarUrl, gravatarUrlFromHash } from "@/lib/gravatar";
import { UserAvatar as UiUserAvatar } from "@curolia/ui/user-avatar";
import { useEffect, useMemo, useState } from "react";

export type UserAvatarProps = {
  storedAvatarUrl: string | null | undefined;
  email: string | null | undefined;
  /** Precomputed SHA-256 hash for Gravatar (no email needed on the client). */
  gravatarHash?: string | null;
  gravatarSize?: number;
  /**
   * When false, skip Gravatar until the caller knows there is no stored avatar
   * (e.g. while a profile query is still loading).
   */
  gravatarFallback?: boolean;
  label?: string;
  showUnreadDot?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "full";
};

export function UserAvatar({
  storedAvatarUrl,
  email,
  gravatarHash = null,
  gravatarSize = 160,
  gravatarFallback = true,
  label = "",
  showUnreadDot = false,
  size = "md",
}: UserAvatarProps) {
  const trimmedEmail = email?.trim() ?? "";
  const trimmedHash = gravatarHash?.trim() ?? "";
  const stored = storedAvatarUrl?.trim() || null;
  const shouldUseGravatar = gravatarFallback && !stored;
  const [gravatar, setGravatar] = useState<{
    email: string;
    url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!shouldUseGravatar || !trimmedEmail || trimmedHash) return;
    let cancelled = false;
    void getGravatarUrl(trimmedEmail, gravatarSize).then((url) => {
      if (!cancelled) setGravatar({ email: trimmedEmail, url });
    });
    return () => {
      cancelled = true;
    };
  }, [trimmedEmail, trimmedHash, gravatarSize, shouldUseGravatar]);

  const hashGravatarUrl = useMemo(() => {
    if (!shouldUseGravatar || !trimmedHash) return null;
    return gravatarUrlFromHash(trimmedHash, gravatarSize);
  }, [gravatarSize, shouldUseGravatar, trimmedHash]);

  const gravatarUrl =
    hashGravatarUrl ??
    (shouldUseGravatar && trimmedEmail && gravatar?.email === trimmedEmail
      ? gravatar.url
      : null);

  return (
    <UiUserAvatar
      storedAvatarUrl={storedAvatarUrl}
      email={email}
      gravatarUrl={gravatarUrl}
      size={size}
      label={label}
      showUnreadDot={showUnreadDot}
    />
  );
}
