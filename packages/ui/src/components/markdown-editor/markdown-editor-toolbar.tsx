import {
  applyFormat$,
  applyListType$,
  currentListType$,
  openLinkEditDialog$,
  useCellValues,
  usePublisher,
} from "@mdxeditor/editor";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";

import { Button } from "../button";
import styles from "./markdown-editor.module.css";

type MarkdownEditorToolbarProps = {
  disabled?: boolean;
};

export function MarkdownEditorToolbar({
  disabled,
}: MarkdownEditorToolbarProps) {
  const applyFormat = usePublisher(applyFormat$);
  const applyListType = usePublisher(applyListType$);
  const openLinkDialog = usePublisher(openLinkEditDialog$);
  const [listType] = useCellValues(currentListType$);

  return (
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
        onClick={() => applyFormat("bold")}
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
        onClick={() => applyFormat("italic")}
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
        onClick={() => applyFormat("underline")}
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
        aria-pressed={listType === "bullet"}
        onClick={() => applyListType(listType === "bullet" ? "" : "bullet")}
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
        aria-pressed={listType === "number"}
        onClick={() => applyListType(listType === "number" ? "" : "number")}
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
        onClick={() => openLinkDialog()}
      >
        <Link2 aria-hidden />
      </Button>
    </div>
  );
}
