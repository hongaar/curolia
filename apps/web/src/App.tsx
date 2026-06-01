import { AppShell } from "@/components/layout/app-shell";
import { AppSettingsPage } from "@/pages/app-settings-page";
import { BlogPage } from "@/pages/blog-page";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { BlogHomeRedirectPage } from "@/pages/home-redirect-page";
import { InvitationsPage } from "@/pages/invitations-page";
import { JournalSettingsPage } from "@/pages/journal-settings-page";
import { LoginPage } from "@/pages/login-page";
import { MapPage } from "@/pages/map-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { OpenSourceLicensesPage } from "@/pages/open-source-licenses-page";
import { PluginsPage } from "@/pages/plugins-page";
import { ProfilePage } from "@/pages/profile-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { RootPage } from "@/pages/root-page";
import { TraceDetailPage } from "@/pages/trace-detail-page";
import { TraceLegacyRedirectPage } from "@/pages/trace-legacy-redirect-page";
import { ProtectedLayout } from "@/routes/protected-layout";
import {
  ContactPageContent,
  PrivacyPolicyPageContent,
  TermsPageContent,
} from "@curolia/ui/landing-page";
import { Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootPage />} />
      <Route path="/contact" element={<ContactPageContent />} />
      <Route path="/privacy" element={<PrivacyPolicyPageContent />} />
      <Route path="/terms" element={<TermsPageContent />} />
      <Route path="/licenses" element={<OpenSourceLicensesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/signup"
        element={<Navigate to="/login?tab=signup" replace />}
      />
      <Route element={<ProtectedLayout />}>
        <Route element={<AppShell />}>
          <Route path="map/:journalSlug" element={<MapPage />} />
          <Route path="blog" element={<BlogHomeRedirectPage />} />
          <Route path="blog/:journalSlug" element={<BlogPage />} />
          <Route
            path="traces/:journalSlug/:traceSlug"
            element={<TraceDetailPage />}
          />
          <Route
            path="traces/:legacyTraceId"
            element={<TraceLegacyRedirectPage />}
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<AppSettingsPage />} />
          <Route path="settings/plugins" element={<PluginsPage />} />
          <Route
            path="settings/connectors"
            element={<Navigate to="/settings/plugins" replace />}
          />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="invitations" element={<InvitationsPage />} />
          <Route
            path="journals/:journalId/settings"
            element={<JournalSettingsPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
