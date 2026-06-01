import { AppShell } from "@/components/layout/app-shell";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { LoginPage } from "@/pages/login-page";
import { OpenSourceLicensesPage } from "@/pages/open-source-licenses-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { RootPage } from "@/pages/root-page";
import { appShellRouteElements } from "@/routes/app-shell-routes";
import { StackLayout } from "@/routes/stack-layout";
import { ProtectedLayout } from "@/routes/protected-layout";
import {
  ContactPageContent,
  PrivacyPolicyPageContent,
  TermsPageContent,
} from "@curolia/site/pages";
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
          <Route element={<StackLayout />}>{appShellRouteElements}</Route>
        </Route>
      </Route>
    </Routes>
  );
}
