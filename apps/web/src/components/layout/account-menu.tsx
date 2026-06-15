import { UserAvatar } from "@/components/user-avatar";
import { useUnreadNotificationsCount } from "@/hooks/use-map-access";
import { profileEditHref, publicProfileHref } from "@/lib/profile-route";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import type { Profile } from "@/types/database";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import {
  AccountMenuContent,
  AccountMenuItemIcon,
  AccountMenuItemLabel,
  AccountMenuSignedInLabel,
  AccountMenuTrigger,
} from "@curolia/ui/floating-nav-bar";
import { useQuery } from "@tanstack/react-query";
import { Bell, Info, Plug, Settings2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AccountMenu() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { openAboutDialog } = useNavigationShell();

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

  const unreadQuery = useUnreadNotificationsCount(user?.id);
  const hasUnread = (unreadQuery.data ?? 0) > 0;

  return (
    <>
      <DropdownMenu>
        <AccountMenuTrigger title="Account" aria-label="Account menu">
          <UserAvatar
            storedAvatarUrl={profileQuery.data?.avatar_url}
            email={user?.email}
            gravatarFallback={profileQuery.isFetched}
            gravatarSize={128}
            label="Account"
            size="full"
          />
        </AccountMenuTrigger>
        <AccountMenuContent>
          <DropdownMenuGroup>
            <AccountMenuSignedInLabel
              displayName={profileQuery.data?.display_name}
              email={user?.email}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                navigate(
                  profileQuery.data?.slug
                    ? publicProfileHref(profileQuery.data.slug)
                    : profileEditHref(),
                )
              }
            >
              <AccountMenuItemIcon>
                <User />
              </AccountMenuItemIcon>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/notifications")}>
              <AccountMenuItemIcon>
                <Bell />
              </AccountMenuItemIcon>
              <AccountMenuItemLabel showUnreadDot={hasUnread}>
                Notifications
              </AccountMenuItemLabel>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <AccountMenuItemIcon>
                <Settings2 />
              </AccountMenuItemIcon>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/plugins")}>
              <AccountMenuItemIcon>
                <Plug />
              </AccountMenuItemIcon>
              Plugins
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openAboutDialog()}>
              <AccountMenuItemIcon>
                <Info />
              </AccountMenuItemIcon>
              About
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void signOut()}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </AccountMenuContent>
      </DropdownMenu>
    </>
  );
}
