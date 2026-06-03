import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorFallback } from "./error-fallback";

export type ErrorBoundaryFallbackRenderProps = {
  error: Error;
  reset: () => void;
};

export type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?:
    | ReactNode
    | ((props: ErrorBoundaryFallbackRenderProps) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** When any value changes, the boundary clears and children re-render. */
  resetKeys?: readonly unknown[];
  /** Passed to the default fallback (e.g. enable in dev builds). */
  showErrorDetails?: boolean;
  /** Layout for the default fallback. */
  fallbackLayout?: "page" | "viewport";
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { error } = this.state;
    if (!error || !this.props.resetKeys) return;

    const prev = prevProps.resetKeys;
    const next = this.props.resetKeys;
    if (
      prev === next ||
      (prev?.length === next.length &&
        prev.every((key, index) => Object.is(key, next[index])))
    ) {
      return;
    }

    this.reset();
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const { fallback, showErrorDetails, fallbackLayout } = this.props;
    const reset = this.reset;

    if (typeof fallback === "function") {
      return fallback({ error, reset });
    }

    if (fallback) {
      return fallback;
    }

    return (
      <ErrorFallback
        error={error}
        onRetry={reset}
        layout={fallbackLayout ?? "viewport"}
        showErrorDetails={showErrorDetails}
      />
    );
  }
}
