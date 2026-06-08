import "@mdxeditor/editor/style.css";

import {
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  toolbarPlugin,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import {
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type CSSProperties,
} from "react";

import { useFieldDescribedBy } from "../field/field";
import { MarkdownEditorToolbar } from "./markdown-editor-toolbar";
import styles from "./markdown-editor.module.css";

export type MarkdownEditorBodyProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
} & Pick<ComponentProps<"textarea">, "aria-label" | "aria-labelledby">;

export function MarkdownEditorBody({
  id,
  value,
  onChange,
  rows = 4,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: MarkdownEditorBodyProps) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const lastEmittedRef = useRef(value);

  const plugins = useMemo(
    () => [
      listsPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      toolbarPlugin({
        toolbarClassName: styles.toolbarHost,
        toolbarContents: () => <MarkdownEditorToolbar disabled={disabled} />,
      }),
    ],
    [disabled],
  );

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    editorRef.current?.setMarkdown(value);
    lastEmittedRef.current = value;
  }, [value]);

  const minHeightRem = Math.max(4, rows * 1.5);
  const fieldDescribedBy = useFieldDescribedBy();

  return (
    <div
      className={styles.root}
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={fieldDescribedBy}
      style={
        {
          "--markdown-editor-min-height": `${minHeightRem}rem`,
        } as CSSProperties
      }
    >
      {id ? <span id={id} className={styles.srOnly} /> : null}
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={(markdown, initialMarkdownNormalize) => {
          lastEmittedRef.current = markdown;
          if (!initialMarkdownNormalize) onChange(markdown);
        }}
        readOnly={disabled}
        placeholder={placeholder}
        className={styles.mdxEditor}
        contentEditableClassName={styles.contentEditable}
        plugins={plugins}
      />
    </div>
  );
}
