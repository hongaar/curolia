import { HomeChangelog } from "@/components/home/home-changelog";
import { UserAvatar } from "@/components/user-avatar";
import { profileEditHref, publicProfileHref } from "@/lib/profile-route";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/database";
import { HomeFeedProfileLink } from "@curolia/ui/home-feed";
import { useQuery } from "@tanstack/react-query";

export function HomeSidebar() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: Boolean(user),
  });

  const profile = profileQuery.data;
  const profileHref = profile?.slug
    ? publicProfileHref(profile.slug)
    : profileEditHref();
  const username =
    profile?.display_name?.trim() ||
    (profile?.slug ? `@${profile.slug}` : user?.email) ||
    "you";

  return (
    <>
      <HomeFeedProfileLink
        to={profileHref}
        avatar={
          <UserAvatar
            storedAvatarUrl={profile?.avatar_url}
            email={user?.email}
            gravatarHash={profile?.gravatar_hash}
            gravatarFallback={!profileQuery.isLoading}
            gravatarSize={80}
            size="sm"
            label={username}
          />
        }
        title={`Signed in as ${username}`}
        subtitle="View my profile"
      />
      <HomeChangelog />
    </>
  );
}
