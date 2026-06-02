export type MarkdownSelectionRange = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export function wrapMarkdownSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
): MarkdownSelectionRange {
  const selected = value.slice(selectionStart, selectionEnd);
  const next =
    value.slice(0, selectionStart) +
    before +
    selected +
    after +
    value.slice(selectionEnd);
  return {
    value: next,
    selectionStart: selectionStart + before.length,
    selectionEnd: selectionEnd + before.length,
  };
}

function lineBounds(value: string, index: number) {
  const start = value.lastIndexOf("\n", index - 1) + 1;
  const endNewline = value.indexOf("\n", index);
  const end = endNewline === -1 ? value.length : endNewline;
  return { start, end };
}

function selectedLineRange(
  value: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const startLine = lineBounds(value, selectionStart).start;
  const endLine = lineBounds(
    value,
    Math.max(selectionStart, selectionEnd - 1),
  ).end;
  return { start: startLine, end: endLine };
}

const BULLET_PREFIX = /^-\s+/;
const ORDERED_PREFIX = /^\d+\.\s+/;

export function toggleMarkdownLineList(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  kind: "bullet" | "ordered",
): MarkdownSelectionRange {
  const { start, end } = selectedLineRange(value, selectionStart, selectionEnd);
  const block = value.slice(start, end);
  const lines = block.split("\n");
  const prefix = kind === "bullet" ? "- " : "1. ";
  const test = kind === "bullet" ? BULLET_PREFIX : ORDERED_PREFIX;

  const allPrefixed =
    lines.length > 0 && lines.every((line) => !line || test.test(line));

  const nextLines = lines.map((line) => {
    if (!line.trim()) return line;
    if (allPrefixed) return line.replace(test, "");
    if (test.test(line)) return line;
    return prefix + line;
  });

  const nextBlock = nextLines.join("\n");
  const next = value.slice(0, start) + nextBlock + value.slice(end);
  const delta = nextBlock.length - block.length;
  return {
    value: next,
    selectionStart: Math.min(selectionStart, start),
    selectionEnd: Math.max(selectionEnd, end) + delta,
  };
}

export function insertMarkdownLink(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  url: string,
): MarkdownSelectionRange {
  const label = value.slice(selectionStart, selectionEnd).trim() || "link";
  const md = `[${label}](${url})`;
  const next = value.slice(0, selectionStart) + md + value.slice(selectionEnd);
  return {
    value: next,
    selectionStart,
    selectionEnd: selectionStart + md.length,
  };
}
