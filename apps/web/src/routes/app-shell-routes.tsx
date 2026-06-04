import { AppSettingsPage } from "@/pages/app-settings-page";
import { BlogPage } from "@/pages/blog-page";
import { BlogHomeRedirectPage } from "@/pages/home-redirect-page";
import { InvitationsPage } from "@/pages/invitations-page";
import { MapSettingsPage } from "@/pages/map-settings-page";
import { MapPage } from "@/pages/map-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { PluginsPage } from "@/pages/plugins-page";
import { ProfilePage } from "@/pages/profile-page";
import { PinDetailPage } from "@/pages/pin-detail-page";
import { PinLegacyRedirectPage } from "@/pages/pin-legacy-redirect-page";
import { Navigate, Route } from "react-router-dom";

/** Child routes rendered inside AppShell (shared by App and the mobile stack layout). */
export const appShellRouteElements = (
  <>
    <Route path="map/:mapSlug" element={<MapPage />} />
    <Route path="blog" element={<BlogHomeRedirectPage />} />
    <Route path="blog/:mapSlug" element={<BlogPage />} />
    <Route path="pins/:mapSlug/:pinSlug" element={<PinDetailPage />} />
    <Route path="pins/:legacyPinId" element={<PinLegacyRedirectPage />} />
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
    <Route path="maps/:mapSlug/settings" element={<MapSettingsPage />} />
  </>
);
