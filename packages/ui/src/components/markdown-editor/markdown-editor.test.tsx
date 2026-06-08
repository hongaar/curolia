import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "./markdown-editor";

vi.mock("@mdxeditor/editor", () => ({
  MDXEditor: () => <div>Editor</div>,
  headingsPlugin: () => ({}),
  listsPlugin: () => ({}),
  quotePlugin: () => ({}),
  thematicBreakPlugin: () => ({}),
  markdownShortcutPlugin: () => ({}),
  linkPlugin: () => ({}),
  linkDialogPlugin: () => ({}),
  toolbarPlugin: () => ({}),
  UndoRedo: () => null,
  BoldItalicUnderlineToggles: () => null,
  ListsToggle: () => null,
  BlockTypeSelect: () => null,
  CreateLink: () => null,
}));

describe("MarkdownEditor", () => {
  it("renders without crashing", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
