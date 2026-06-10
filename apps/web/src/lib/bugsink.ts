import * as Sentry from "@sentry/react";
import type { ErrorInfo } from "react";

const dsn = import.meta.env.VITE_BUGSINK_DSN?.trim();

let initialized = false;

export function isBugsinkEnabled(): boolean {
  return Boolean(dsn);
}

export function initBugsink(): void {
  if (!dsn || initialized || typeof window === "undefined") {
    return;
  }

  Sentry.init({
    dsn,
    release: `curolia@${import.meta.env.VITE_APP_VERSION}`,
    environment: import.meta.env.PROD ? "production" : "development",
    tracesSampleRate: 0,
    sendClientReports: false,
  });

  initialized = true;
}

export function reportAppError(
  error: Error,
  errorInfo: ErrorInfo,
  context?: string,
): void {
  console.error(context ?? "App error", error, errorInfo);
  if (initialized) {
    Sentry.captureReactException(error, errorInfo);
  }
}

export function bugsinkReactErrorHandler(): (
  error: unknown,
  errorInfo: ErrorInfo,
) => void {
  return Sentry.reactErrorHandler();
}
