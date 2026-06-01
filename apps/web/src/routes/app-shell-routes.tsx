import { AppSettingsPage } from "@/pages/app-settings-page";
import { BlogPage } from "@/pages/blog-page";
import { BlogHomeRedirectPage } from "@/pages/home-redirect-page";
import { InvitationsPage } from "@/pages/invitations-page";
import { JournalSettingsPage } from "@/pages/journal-settings-page";
import { MapPage } from "@/pages/map-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { PluginsPage } from "@/pages/plugins-page";
import { ProfilePage } from "@/pages/profile-page";
import { TraceDetailPage } from "@/pages/trace-detail-page";
import { TraceLegacyRedirectPage } from "@/pages/trace-legacy-redirect-page";
import { Navigate, Route } from "react-router-dom";

/** Child routes rendered inside AppShell (shared by App and the mobile stack layout). */
export const appShellRouteElements = (
  <>
    <Route path="map/:journalSlug" element={<MapPage />} />
    <Route path="blog" element={<BlogHomeRedirectPage />} />
    <Route path="blog/:journalSlug" element={<BlogPage />} />
    <Route
      path="traces/:journalSlug/:traceSlug"
      element={<TraceDetailPage />}
    />
    <Route path="traces/:legacyTraceId" element={<TraceLegacyRedirectPage />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="settings" element={<AppSettingsPage />} />
    <Route path="plugins" element={<PluginsPage />} />
    <Route
      path="settings/plugins"
      element={<Navigate to="/plugins" replace />}
    />
    <Route
      path="settings/connectors"
      element={<Navigate to="/plugins" replace />}
    />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="invitations" element={<InvitationsPage />} />
    <Route
      path="journals/:journalId/settings"
      element={<JournalSettingsPage />}
    />
  </>
);
