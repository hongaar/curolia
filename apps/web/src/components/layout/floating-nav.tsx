import { MainToolbarPanel } from "@/components/layout/main-toolbar-panel";
import { UserAvatar } from "@/components/user-avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import type { Profile } from "@/types/database";
import {
  AccountMenuContent,
  AccountMenuItemIcon,
  AccountMenuSignedInLabel,
  AccountMenuTrigger,
  FloatingNavBar,
} from "@curolia/ui/curolia/floating-nav-bar";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Bell, Plug, Settings2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function FloatingNav() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

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

  return (
    <FloatingNavBar
      toolbar={<MainToolbarPanel />}
      accountMenu={
        <DropdownMenu>
          <AccountMenuTrigger title="Account" aria-label="Account menu">
            <UserAvatar
              storedAvatarUrl={profileQuery.data?.avatar_url}
              email={user?.email}
              gravatarSize={128}
              label="Account"
              size="full"
            />
          </AccountMenuTrigger>
          <AccountMenuContent>
            <DropdownMenuGroup>
              <AccountMenuSignedInLabel email={user?.email} />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <AccountMenuItemIcon>
                  <User />
                </AccountMenuItemIcon>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/notifications")}>
                <AccountMenuItemIcon>
                  <Bell />
                </AccountMenuItemIcon>
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <AccountMenuItemIcon>
                  <Settings2 />
                </AccountMenuItemIcon>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings/plugins")}>
                <AccountMenuItemIcon>
                  <Plug />
                </AccountMenuItemIcon>
                Plugins
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
      }
    />
  );
}
