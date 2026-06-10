import {
  bugsinkReactErrorHandler,
  initBugsink,
  reportAppError,
} from "@/lib/bugsink";
import { syncMapRouteDocumentClass } from "@/lib/map-chrome";
import { syncStackChromeDocumentClass } from "@/lib/stack-chrome";
import { initUmami } from "@/lib/umami";
import { AuthProvider } from "@/providers/auth-provider";
import { Capacitor } from "@capacitor/core";
import { ErrorBoundary } from "@curolia/ui/error-boundary";
import { Toaster } from "@curolia/ui/sonner";
import "@curolia/ui/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add("native-app");
}

syncMapRouteDocumentClass();
syncStackChromeDocumentClass();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

registerSW({ immediate: true });
initBugsink();
initUmami();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root element");
}

const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary
              showErrorDetails={import.meta.env.DEV}
              onError={(error, errorInfo) => {
                reportAppError(error, errorInfo, "Unhandled app error");
              }}
            >
              <App />
            </ErrorBoundary>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

const rootOptions = {
  onCaughtError: bugsinkReactErrorHandler(),
  onUncaughtError: bugsinkReactErrorHandler(),
  onRecoverableError: bugsinkReactErrorHandler(),
};

if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, app, rootOptions);
} else {
  createRoot(rootEl, rootOptions).render(app);
}
