import { lazy, Suspense } from "react";

import { Textarea } from "../textarea";
import type { MarkdownEditorBodyProps } from "./markdown-editor-body";

const MarkdownEditorBody = lazy(() =>
  import("./markdown-editor-body").then((m) => ({
    default: m.MarkdownEditorBody,
  })),
);

export type MarkdownEditorProps = MarkdownEditorBodyProps;

function MarkdownEditorFallback({
  id,
  value,
  onChange,
  rows = 4,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: MarkdownEditorProps) {
  return (
    <Textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    />
  );
}

export function MarkdownEditor(props: MarkdownEditorProps) {
  return (
    <Suspense fallback={<MarkdownEditorFallback {...props} />}>
      <MarkdownEditorBody {...props} />
    </Suspense>
  );
}
