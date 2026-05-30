import { getGravatarUrl } from "@/lib/gravatar";
import { UserAvatar as UiUserAvatar } from "@curolia/ui/user-avatar";
import { useEffect, useState } from "react";

export type UserAvatarProps = {
  storedAvatarUrl: string | null | undefined;
  email: string | null | undefined;
  gravatarSize?: number;
  label?: string;
  showUnreadDot?: boolean;
  size?: "sm" | "md" | "lg" | "full";
};

export function UserAvatar({
  storedAvatarUrl,
  email,
  gravatarSize = 160,
  label = "",
  showUnreadDot = false,
  size = "md",
}: UserAvatarProps) {
  const trimmedEmail = email?.trim() ?? "";
  const [gravatar, setGravatar] = useState<{
    email: string;
    url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!trimmedEmail) return;
    let cancelled = false;
    void getGravatarUrl(trimmedEmail, gravatarSize).then((url) => {
      if (!cancelled) setGravatar({ email: trimmedEmail, url });
    });
    return () => {
      cancelled = true;
    };
  }, [trimmedEmail, gravatarSize]);

  const gravatarUrl =
    trimmedEmail && gravatar?.email === trimmedEmail ? gravatar.url : null;

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
