import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { SidebarTagsFilterDropdown } from "@/components/layout/sidebar-tags-filter-dropdown";
import { journalSwitchHref, journalViewHref } from "@/lib/app-paths";
import { defaultJournalIcon } from "@/lib/journal-display-icon";
import { useJournal } from "@/providers/journal-provider";
import { useRegisteredTagSidebar } from "@/providers/tag-sidebar-provider";
import type { Journal } from "@/types/database";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@curolia/ui/dropdown-menu";
import { Separator } from "@curolia/ui/separator";
import { BookOpen, Check, ChevronDown, Map, Pencil, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  JournalDropdownEditButton,
  JournalDropdownRow,
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
  SidebarJournalEmoji,
  SidebarJournalName,
  SidebarPickerChevron,
  SidebarPickerLabel,
  SidebarPickerTrigger,
} from "@curolia/ui/navigation-sidebar";

function journalEmoji(journal: Journal) {
  return journal.icon_emoji ?? defaultJournalIcon(journal.is_personal);
}

type NavigationSidebarContentProps = {
  userId: string | undefined;
  openNewJournalDialog: () => void;
  onOpenJournalSettings: (journalId: string) => void;
};

export function NavigationSidebarContent({
  userId,
  openNewJournalDialog,
  onOpenJournalSettings,
}: NavigationSidebarContentProps) {
  const tagSidebar = useRegisteredTagSidebar();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { journals, activeJournal } = useJournal();
  const mapTo = activeJournal?.slug
    ? journalViewHref("map", activeJournal.slug)
    : "/";
  const blogTo = activeJournal?.slug
    ? journalViewHref("blog", activeJournal.slug)
    : "/";

  return (
    <NavigationSidebarRoot>
      <NavigationSidebarSection>
        <NavigationSidebarLabel spaced>View</NavigationSidebarLabel>
        <NavigationSidebarNavLink
          to={mapTo}
          end
          icon={
            <NavigationSidebarIcon>
              <Map aria-hidden />
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
        <NavigationSidebarLabel>Journal</NavigationSidebarLabel>
        <DropdownMenu>
          <SidebarPickerTrigger>
            <SidebarPickerLabel
              emoji={
                activeJournal ? (
                  <span aria-hidden>{journalEmoji(activeJournal)}</span>
                ) : undefined
              }
            >
              {activeJournal?.name ?? "Select journal"}
            </SidebarPickerLabel>
            <SidebarPickerChevron>
              <ChevronDown aria-hidden />
            </SidebarPickerChevron>
          </SidebarPickerTrigger>
          <SidebarDropdownContent align="start" sideOffset={6}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Journals</DropdownMenuLabel>
              {journals.map((j) => {
                const selected = j.id === activeJournal?.id;
                return (
                  <JournalDropdownRow key={j.id}>
                    <SidebarDropdownMenuItem
                      onClick={() => {
                        navigate(journalSwitchHref(j, pathname, search));
                      }}
                    >
                      <SidebarJournalEmoji>
                        {journalEmoji(j)}
                      </SidebarJournalEmoji>
                      <SidebarJournalName
                        selected={selected}
                        personal={j.is_personal}
                      >
                        {j.name}
                      </SidebarJournalName>
                      {selected ? (
                        <SidebarCheckIcon>
                          <Check aria-hidden />
                        </SidebarCheckIcon>
                      ) : (
                        <SidebarCheckSpacer />
                      )}
                    </SidebarDropdownMenuItem>
                    <JournalDropdownEditButton
                      title="Edit journal"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onOpenJournalSettings(j.id);
                      }}
                    >
                      <Pencil aria-hidden />
                    </JournalDropdownEditButton>
                  </JournalDropdownRow>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openNewJournalDialog()}>
              <Plus aria-hidden />
              New journal…
            </DropdownMenuItem>
          </SidebarDropdownContent>
        </DropdownMenu>
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
            Open Map or Blog to filter traces by tags.
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
