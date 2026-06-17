import { HomeEditedMapsList } from "@/components/home/home-edited-maps-list";
import type { HomeFeedMap } from "@/lib/home-feed";
import { profileEditHref, publicProfileHref } from "@/lib/profile-route";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useNavigationShell } from "@/providers/navigation-shell-provider";
import type { Profile } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  HomeFeedNewMapAction,
  HomeFeedShortcutActions,
  HomeFeedShortcuts,
} from "@curolia/ui/home-feed";
import { useQuery } from "@tanstack/react-query";
import { MapPlus, User } from "lucide-react";
import { Link } from "react-router-dom";

export function HomeSidebar({ editedMaps }: { editedMaps: HomeFeedMap[] }) {
  const { user } = useAuth();
  const { openNewMapDialog } = useNavigationShell();

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

  const profileHref = profileQuery.data?.slug
    ? publicProfileHref(profileQuery.data.slug)
    : profileEditHref();

  return (
    <>
      <HomeEditedMapsList maps={editedMaps} />
      <HomeFeedShortcuts>
        <HomeFeedShortcutActions>
          <HomeFeedNewMapAction>
            <Button onClick={() => openNewMapDialog()}>
              <MapPlus aria-hidden />
              New map
            </Button>
          </HomeFeedNewMapAction>
          <HomeFeedNewMapAction>
            <Button variant="outline" render={<Link to={profileHref} />}>
              <User aria-hidden />
              View my profile
            </Button>
          </HomeFeedNewMapAction>
        </HomeFeedShortcutActions>
      </HomeFeedShortcuts>
    </>
  );
}
