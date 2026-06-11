import { AppSettingsPage } from "@/pages/app-settings-page";
import { BlogPage } from "@/pages/blog-page";
import { InvitationsPage } from "@/pages/invitations-page";
import { MapPage } from "@/pages/map-page";
import { MapSettingsPage } from "@/pages/map-settings-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { PinDetailPage } from "@/pages/pin-detail-page";
import { PinEditPage } from "@/pages/pin-edit-page";
import { PluginsPage } from "@/pages/plugins-page";
import { ProfilePage } from "@/pages/profile-page";
import { PublicMapShortcutRedirect } from "@/routes/public-map-shortcut-redirect";
import { Navigate, Route } from "react-router-dom";

/** Child routes rendered inside AppShell (shared by App and the mobile stack layout). */
export const appShellRouteElements = (
  <>
    <Route
      path=":profileSlug/:mapSlug"
      element={<PublicMapShortcutRedirect />}
    />
    <Route path=":profileSlug/:mapSlug/map" element={<MapPage />} />
    <Route path=":profileSlug/:mapSlug/blog" element={<BlogPage />} />
    <Route
      path=":profileSlug/:mapSlug/pin/:pinSlug/edit"
      element={<PinEditPage />}
    />
    <Route
      path=":profileSlug/:mapSlug/pin/:pinSlug"
      element={<PinDetailPage />}
    />
    <Route
      path=":profileSlug/:mapSlug/settings"
      element={<MapSettingsPage />}
    />
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
  </>
);
