import type { Meta, StoryObj } from "@storybook/react";
import { componentStoryMeta, storyDocs } from "../../storybook/docs";
import { StoryFrame } from "../../storybook/story-frame";
import { Button } from "../button";
import { Text } from "../text";
import { ErrorBoundary } from "./error-boundary";
import { ErrorFallback } from "./error-fallback";

const DEMO_ERROR = new Error("Storybook demo error");

const meta = {
  title: "Error Boundary",
  ...componentStoryMeta(
    `Catches render errors and shows a recoverable fallback.`,
    `Wrap route or feature subtrees. Use \`resetKeys\` to auto-recover when inputs change, or \`fallback\` for custom UI.`,
  ),
  component: ErrorBoundary,
} satisfies Meta;

export default meta;
type Story = StoryObj;

function ThrowWhenEnabled({ enabled }: { enabled: boolean }) {
  if (enabled) throw DEMO_ERROR;
  return <Text variant="body">Content loaded successfully.</Text>;
}

export const ErrorFallbackViewport: StoryObj<typeof ErrorFallback> = {
  parameters: storyDocs(
    'Default `ErrorFallback` with `layout="viewport"` — full-screen overlay.',
  ),
  render: () => (
    <ErrorFallback
      error={DEMO_ERROR}
      onRetry={() => undefined}
      layout="viewport"
    />
  ),
};

export const ErrorFallbackPage: StoryObj<typeof ErrorFallback> = {
  parameters: storyDocs(
    '`layout="page"` for in-page settings or stack layouts.',
  ),
  render: () => (
    <StoryFrame width="md">
      <ErrorFallback
        error={DEMO_ERROR}
        onRetry={() => undefined}
        layout="page"
      />
    </StoryFrame>
  ),
};

export const WithErrorDetails: StoryObj<typeof ErrorFallback> = {
  parameters: storyDocs(
    "`showErrorDetails` surfaces `error.message` (enable in dev builds).",
  ),
  render: () => (
    <StoryFrame width="md">
      <ErrorFallback
        error={DEMO_ERROR}
        onRetry={() => undefined}
        layout="page"
        showErrorDetails
      />
    </StoryFrame>
  ),
};

export const BoundaryDefaultFallback: Story = {
  parameters: storyDocs(
    "Boundary catches a thrown error and renders the default fallback.",
  ),
  render: () => (
    <StoryFrame width="md">
      <ErrorBoundary fallbackLayout="page">
        <ThrowWhenEnabled enabled />
      </ErrorBoundary>
    </StoryFrame>
  ),
};

export const CustomFallbackRender: Story = {
  parameters: storyDocs(
    "`fallback` render prop receives `{ error, reset }` for custom UI.",
  ),
  render: () => (
    <StoryFrame width="md">
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <div>
            <Text variant="body">Custom fallback: {error.message}</Text>
            <Button type="button" size="sm" onClick={reset}>
              Dismiss
            </Button>
          </div>
        )}
      >
        <ThrowWhenEnabled enabled />
      </ErrorBoundary>
    </StoryFrame>
  ),
};

export const CustomFallbackNode: Story = {
  parameters: storyDocs("Static `fallback` node replaces the default panel."),
  render: () => (
    <StoryFrame width="md">
      <ErrorBoundary fallback={<Text variant="muted">Something broke.</Text>}>
        <ThrowWhenEnabled enabled />
      </ErrorBoundary>
    </StoryFrame>
  ),
};

export const FallbackLayoutPage: Story = {
  parameters: storyDocs(
    '`fallbackLayout="page"` on the boundary default fallback.',
  ),
  render: () => (
    <StoryFrame width="md">
      <ErrorBoundary fallbackLayout="page">
        <ThrowWhenEnabled enabled />
      </ErrorBoundary>
    </StoryFrame>
  ),
};
