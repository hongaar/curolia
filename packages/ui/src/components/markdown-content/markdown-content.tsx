import { lazy, Suspense } from "react";

import type { MarkdownContentBodyProps } from "./markdown-content-body";

const MarkdownContentBody = lazy(() =>
  import("./markdown-content-body").then((m) => ({
    default: m.MarkdownContentBody,
  })),
);

export type MarkdownContentProps = {
  markdown: string;
  className?: string;
};

export function MarkdownContent({ markdown, className }: MarkdownContentProps) {
  const trimmed = markdown.trim();
  if (!trimmed) return null;

  const bodyProps: MarkdownContentBodyProps = {
    markdown: trimmed,
    className,
  };

  return (
    <Suspense fallback={null}>
      <MarkdownContentBody {...bodyProps} />
    </Suspense>
  );
}
