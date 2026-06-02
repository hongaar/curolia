import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import { useCallback, useRef, type ComponentProps } from "react";

import {
  insertMarkdownLink,
  toggleMarkdownLineList,
  wrapMarkdownSelection,
} from "../../lib/markdown-selection";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Textarea } from "../textarea";
import styles from "./markdown-editor.module.css";

export type MarkdownEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
} & Pick<ComponentProps<"textarea">, "aria-label" | "aria-labelledby">;

export function MarkdownEditor({
  id,
  value,
  onChange,
  rows = 4,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyEdit = useCallback(
    (
      edit: (
        current: string,
        start: number,
        end: number,
      ) => { value: string; selectionStart: number; selectionEnd: number },
    ) => {
      const el = textareaRef.current;
      if (!el || disabled) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = edit(value, start, end);
      onChange(next.value);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(next.selectionStart, next.selectionEnd);
      });
    },
    [disabled, onChange, value],
  );

  const onBold = () => {
    applyEdit((current, start, end) =>
      wrapMarkdownSelection(current, start, end, "**", "**"),
    );
  };

  const onItalic = () => {
    applyEdit((current, start, end) =>
      wrapMarkdownSelection(current, start, end, "*", "*"),
    );
  };

  const onUnderline = () => {
    applyEdit((current, start, end) =>
      wrapMarkdownSelection(current, start, end, "<u>", "</u>"),
    );
  };

  const onBulletList = () => {
    applyEdit((current, start, end) =>
      toggleMarkdownLineList(current, start, end, "bullet"),
    );
  };

  const onOrderedList = () => {
    applyEdit((current, start, end) =>
      toggleMarkdownLineList(current, start, end, "ordered"),
    );
  };

  const onLink = () => {
    const el = textareaRef.current;
    if (!el || disabled) return;
    const url = window.prompt("Link URL", "https://");
    if (!url?.trim()) return;
    applyEdit((current, start, end) =>
      insertMarkdownLink(current, start, end, url.trim()),
    );
  };

  return (
    <div className={styles.root}>
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Description formatting"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Bold"
          title="Bold"
          onClick={onBold}
        >
          <Bold aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Italic"
          title="Italic"
          onClick={onItalic}
        >
          <Italic aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Underline"
          title="Underline"
          onClick={onUnderline}
        >
          <Underline aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Bullet list"
          title="Bullet list"
          onClick={onBulletList}
        >
          <List aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Numbered list"
          title="Numbered list"
          onClick={onOrderedList}
        >
          <ListOrdered aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Link"
          title="Link"
          onClick={onLink}
        >
          <Link2 aria-hidden />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        className={cn(styles.textarea)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      />
    </div>
  );
}
