import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { SidebarTagsFilterDropdown } from "@/components/layout/sidebar-tags-filter-dropdown";
import { usePublicMapOwnerName } from "@/hooks/use-public-map-owner-name";
import { mapSwitchHref, mapViewHref } from "@/lib/app-paths";
import { defaultMapIcon } from "@/lib/map-display-icon";
import { useMap } from "@/providers/map-provider";
import { useRegisteredTagSidebar } from "@/providers/tag-sidebar-provider";
import type { CuroliaMap } from "@/types/database";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import {
  MapDropdownEditButton,
  MapDropdownRow,
  NavigationSidebarEmoji,
  NavigationSidebarHint,
  NavigationSidebarIcon,
  NavigationSidebarLabel,
  NavigationSidebarNavLink,
  NavigationSidebarRoot,
  NavigationSidebarSection,
  SidebarCheckIcon,
  SidebarCheckSpacer,
  SidebarDropdownContent,
  SidebarDropdownMenuItem,
  SidebarMapEmoji,
  SidebarMapName,
  SidebarPickerTrigger,
} from "@curolia/ui/navigation-sidebar";
import { PublicMapToolbarInfo } from "@curolia/ui/map-picker";
import { Separator } from "@curolia/ui/separator";
import { BookOpen, Check, Map as MapIcon, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function mapEmoji(map: CuroliaMap) {
  return map.icon_emoji ?? defaultMapIcon();
}

type NavigationSidebarContentProps = {
  userId: string | undefined;
  openNewMapDialog: () => void;
  onOpenMapSettings: (mapSlug: string) => void;
};

export function NavigationSidebarContent({
  userId,
  openNewMapDialog,
  onOpenMapSettings,
}: NavigationSidebarContentProps) {
  const tagSidebar = useRegisteredTagSidebar();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { maps, activeMap, publicView, activeMapId } = useMap();
  const ownerQuery = usePublicMapOwnerName(activeMapId, publicView);
  const [mapsMenuOpen, setMapsMenuOpen] = useState(false);
  const mapTo = activeMap?.slug ? mapViewHref("map", activeMap.slug) : "/";
  const blogTo = activeMap?.slug ? mapViewHref("blog", activeMap.slug) : "/";

  return (
    <NavigationSidebarRoot>
      <NavigationSidebarSection>
        <NavigationSidebarLabel spaced>View</NavigationSidebarLabel>
        <NavigationSidebarNavLink
          to={mapTo}
          end
          icon={
            <NavigationSidebarIcon>
              <MapIcon aria-hidden />
            </NavigationSidebarIcon>
          }
        >
          Map
        </NavigationSidebarNavLink>
        <NavigationSidebarNavLink
          to={blogTo}
          icon={
            <NavigationSidebarIcon>
              <BookOpen aria-hidden />
            </NavigationSidebarIcon>
          }
        >
          Blog
        </NavigationSidebarNavLink>
      </NavigationSidebarSection>

      <Separator />

      <NavigationSidebarSection gap="lg">
        <NavigationSidebarLabel>Map</NavigationSidebarLabel>
        {publicView && activeMap ? (
          <PublicMapToolbarInfo
            mapEmoji={mapEmoji(activeMap)}
            mapName={activeMap.name.trim() || "Map"}
            ownerName={ownerQuery.data}
          />
        ) : (
          <DropdownMenu open={mapsMenuOpen} onOpenChange={setMapsMenuOpen}>
            <SidebarPickerTrigger
              icon={
                activeMap ? (
                  <NavigationSidebarEmoji aria-hidden>
                    {mapEmoji(activeMap)}
                  </NavigationSidebarEmoji>
                ) : null
              }
              label={activeMap?.name ?? "Select map"}
            />
            <SidebarDropdownContent align="start" sideOffset={6}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Maps</DropdownMenuLabel>
                {maps.map((j) => {
                  const selected = j.id === activeMap?.id;
                  return (
                    <MapDropdownRow key={j.id}>
                      <SidebarDropdownMenuItem
                        onClick={() => {
                          navigate(mapSwitchHref(j, pathname, search));
                        }}
                      >
                        <SidebarMapEmoji>{mapEmoji(j)}</SidebarMapEmoji>
                        <SidebarMapName selected={selected}>
                          {j.name}
                        </SidebarMapName>
                        {selected ? (
                          <SidebarCheckIcon>
                            <Check aria-hidden />
                          </SidebarCheckIcon>
                        ) : (
                          <SidebarCheckSpacer />
                        )}
                      </SidebarDropdownMenuItem>
                      {userId ? (
                        <MapDropdownEditButton
                          title="Edit map"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenMapSettings(j.slug.trim());
                            setMapsMenuOpen(false);
                          }}
                        >
                          <Pencil aria-hidden />
                        </MapDropdownEditButton>
                      ) : null}
                    </MapDropdownRow>
                  );
                })}
              </DropdownMenuGroup>
              {userId ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openNewMapDialog()}>
                    <Plus aria-hidden />
                    New map…
                  </DropdownMenuItem>
                </>
              ) : null}
            </SidebarDropdownContent>
          </DropdownMenu>
        )}
      </NavigationSidebarSection>

      <Separator />

      <NavigationSidebarSection gap="lg">
        <NavigationSidebarLabel>Tags & filters</NavigationSidebarLabel>
        {tagSidebar ? (
          <SidebarTagsFilterDropdown
            tags={tagSidebar.tags}
            filterTagIds={tagSidebar.filterTagIds}
            setFilterTagIds={tagSidebar.setFilterTagIds}
            onNewTag={tagSidebar.onNewTag}
            onEditTag={tagSidebar.onEditTag}
          />
        ) : (
          <NavigationSidebarHint>
            Open Map or Blog to filter pins by tags.
          </NavigationSidebarHint>
        )}
      </NavigationSidebarSection>

      {userId ? (
        <>
          <Separator />
          <NavigationSidebarSection gap="lg">
            <NavigationSidebarLabel>Activity</NavigationSidebarLabel>
            <NotificationsPopover variant="sidebar-row" userId={userId} />
          </NavigationSidebarSection>
        </>
      ) : null}
    </NavigationSidebarRoot>
  );
}
