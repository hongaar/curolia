import { AppShell } from "@/components/layout/app-shell";
import { ForgotPasswordPage } from "@/pages/forgot-password-page";
import { LoginPage } from "@/pages/login-page";
import { OpenSourceLicensesPage } from "@/pages/open-source-licenses-page";
import { ResetPasswordPage } from "@/pages/reset-password-page";
import { RootPage } from "@/pages/root-page";
import { appShellRouteElements } from "@/routes/app-shell-routes";
import { ProtectedLayout } from "@/routes/protected-layout";
import { ScrollToTop } from "@/routes/scroll-to-top";
import { UmamiNavigation } from "@/routes/umami-navigation";
import { StackLayout } from "@/routes/stack-layout";
import {
  ContactPageContent,
  EventsLandingPage,
  FamiliesLandingPage,
  FoodLandingPage,
  GeocachingLandingPage,
  HeritageLandingPage,
  HikingLandingPage,
  OpenSourceMindsetPageContent,
  PrivacyPolicyPageContent,
  TermsPageContent,
  TravelLandingPage,
  VanlifeLandingPage,
} from "@curolia/site/pages";
import { Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <UmamiNavigation />
      <Routes>
        <Route path="/" element={<RootPage />} />
        <Route path="/for/travel" element={<TravelLandingPage />} />
        <Route path="/for/food" element={<FoodLandingPage />} />
        <Route path="/for/geocaching" element={<GeocachingLandingPage />} />
        <Route path="/for/families" element={<FamiliesLandingPage />} />
        <Route path="/for/hiking" element={<HikingLandingPage />} />
        <Route path="/for/vanlife" element={<VanlifeLandingPage />} />
        <Route path="/for/heritage" element={<HeritageLandingPage />} />
        <Route path="/for/events" element={<EventsLandingPage />} />
        <Route path="/contact" element={<ContactPageContent />} />
        <Route path="/privacy" element={<PrivacyPolicyPageContent />} />
        <Route path="/terms" element={<TermsPageContent />} />
        <Route path="/open-source" element={<OpenSourceMindsetPageContent />} />
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
            <Route path="/*" element={<StackLayout />}>
              {appShellRouteElements}
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}
