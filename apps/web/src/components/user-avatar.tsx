import { useEffect, useState } from "react";
import { UserAvatar as UiUserAvatar } from "@curolia/ui/user-avatar";
import { getGravatarUrl } from "@/lib/gravatar";

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
  const [gravatar, setGravatar] = useState<string | null>(null);

  useEffect(() => {
    if (!email?.trim()) {
      setGravatar(null);
      return;
    }
    let cancelled = false;
    void getGravatarUrl(email, gravatarSize).then((url) => {
      if (!cancelled) setGravatar(url);
    });
    return () => {
      cancelled = true;
    };
  }, [email, gravatarSize]);

  return (
    <UiUserAvatar
      storedAvatarUrl={storedAvatarUrl}
      email={email}
      gravatarUrl={gravatar}
      size={size}
      label={label}
      showUnreadDot={showUnreadDot}
    />
  );
}
