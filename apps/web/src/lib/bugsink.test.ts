import { afterEach, describe, expect, it, vi } from "vitest";

const sentryMocks = vi.hoisted(() => ({
  init: vi.fn(),
  captureReactException: vi.fn(),
  reactErrorHandler: vi.fn(() => vi.fn()),
}));

vi.mock("@sentry/react", () => sentryMocks);

describe("bugsink", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("does not initialize when the DSN is unset", async () => {
    vi.stubEnv("VITE_BUGSINK_DSN", "");
    const { initBugsink, isBugsinkEnabled } = await import("./bugsink");

    expect(isBugsinkEnabled()).toBe(false);
    initBugsink();
    expect(sentryMocks.init).not.toHaveBeenCalled();
  });

  it("initializes Sentry with the BugSink DSN", async () => {
    vi.stubEnv("VITE_BUGSINK_DSN", "https://key@bugsink.example.com/1");
    vi.stubEnv("VITE_APP_VERSION", "1.2.3");
    const { initBugsink, isBugsinkEnabled } = await import("./bugsink");

    expect(isBugsinkEnabled()).toBe(true);
    initBugsink();
    expect(sentryMocks.init).toHaveBeenCalledWith({
      dsn: "https://key@bugsink.example.com/1",
      release: "curolia@1.2.3",
      environment: "development",
      tracesSampleRate: 0,
      sendClientReports: false,
    });
  });

  it("reports React errors when initialized", async () => {
    vi.stubEnv("VITE_BUGSINK_DSN", "https://key@bugsink.example.com/1");
    const { initBugsink, reportAppError } = await import("./bugsink");
    const error = new Error("boom");
    const errorInfo = { componentStack: "\n    in App" };

    initBugsink();
    reportAppError(error, errorInfo, "Route error");

    expect(sentryMocks.captureReactException).toHaveBeenCalledWith(
      error,
      errorInfo,
    );
  });
});
