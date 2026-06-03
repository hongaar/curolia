import { TriangleAlert } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "../button";
import { FloatingPanel } from "../floating-panel";
import { Stack } from "../stack";
import { Text } from "../text";
import styles from "./error-boundary.module.css";

export type ErrorFallbackProps = {
  error: Error;
  onRetry: () => void;
  /** Use inside app pages (stack / settings); default is full viewport. */
  layout?: "page" | "viewport";
  showErrorDetails?: boolean;
};

function ErrorFallbackPanel({
  error,
  onRetry,
  showErrorDetails,
}: Omit<ErrorFallbackProps, "layout">) {
  return (
    <FloatingPanel
      elevated
      padding="lg"
      className={styles.panel}
      role="alert"
      aria-live="assertive"
    >
      <Stack direction="column" align="center" gap="md">
        <div className={styles.iconBadge} aria-hidden>
          <TriangleAlert className={styles.icon} />
        </div>

        <Stack direction="column" align="center" gap="xs">
          <Text as="h1" variant="titleLg">
            Something went wrong
          </Text>
          <Text variant={["muted", "center"]} className={styles.lead}>
            This part of the app hit a snag. Try again, or reload the page if
            the problem continues.
          </Text>
        </Stack>

        {showErrorDetails ? (
          <pre className={styles.details}>{error.message}</pre>
        ) : null}

        <Stack
          direction="row"
          align="center"
          justify="center"
          gap="sm"
          wrap
          className={styles.actions}
        >
          <Button
            type="button"
            className={styles.actionButton}
            onClick={onRetry}
          >
            Try again
          </Button>
          <Button
            type="button"
            variant="outline"
            className={styles.actionButton}
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </Stack>
      </Stack>
    </FloatingPanel>
  );
}

export function ErrorFallback({
  error,
  onRetry,
  layout = "viewport",
  showErrorDetails = false,
}: ErrorFallbackProps) {
  const isViewport = layout === "viewport";

  return (
    <div
      className={cn(
        styles.shell,
        isViewport ? styles.shellViewport : styles.shellPage,
      )}
    >
      {isViewport ? <div className={styles.backdrop} aria-hidden /> : null}
      <div className={styles.panelWrap}>
        <ErrorFallbackPanel
          error={error}
          onRetry={onRetry}
          showErrorDetails={showErrorDetails}
        />
      </div>
    </div>
  );
}
