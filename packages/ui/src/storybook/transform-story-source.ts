/** Layout-only helpers used in stories; stripped from docs “Show code” snippets. */
const LAYOUT_WRAPPER_TAGS = ["StoryFrame", "StoryRow", "StoryColumn"] as const;

/**
 * Storybook docs passes heterogeneous snippets (full CSF, `render: () => (…)`, or
 * indented JSX only, often with a trailing `}`). Normalize to copy-pasteable JSX.
 */
export function transformStorySource(code: string): string {
  const normalized = code
    .replace(/\r\n/g, "\n")
    .replace(/^\n+/, "")
    .replace(/\s+$/, "");
  const fromRender = extractRenderBody(normalized);
  let jsx = stripWrappingParens(fromRender ?? stripArrowWrapper(normalized));
  jsx = stripSnippetNoise(jsx);
  jsx = unwrapLayoutWrappers(jsx);
  jsx = stripOrphanLayoutCloses(jsx);
  return formatSnippet(jsx);
}

function extractRenderBody(code: string): string | null {
  const renderKey = code.match(/\brender\s*:/);
  if (!renderKey || renderKey.index === undefined) return null;

  let body = code.slice(renderKey.index + renderKey[0].length);
  body = body.replace(/^\s+/, "");
  body = body.replace(/^async\s+/, "");

  const arrowHeader = body.match(/^(?:\([^)]*\)|\(\s*\{[^}]*\}\s*\))\s*=>\s*/s);
  if (arrowHeader) {
    body = body.slice(arrowHeader[0].length);
  } else {
    const fnHeader = body.match(/^function\s*(?:\([^)]*\))?\s*\{/);
    if (!fnHeader) return null;
    body = body.slice(fnHeader[0].length);
    const returnMatch = body.match(/\breturn\s+([\s\S]+?);?\s*\}\s*$/);
    if (!returnMatch) return body.replace(/\s+$/, "");
    body = returnMatch[1];
  }

  return trimRenderExpression(body);
}

function stripArrowWrapper(code: string): string {
  let s = code;
  const arrow = s.match(/^\(\)\s*=>\s*\(\s*\n?/);
  if (arrow) s = s.slice(arrow[0].length);
  else if (s.startsWith("() => ")) s = s.slice(6).trimStart();
  return stripWrappingParens(s);
}

function trimRenderExpression(expr: string): string {
  let s = stripWrappingParens(expr.replace(/^\n+/, "").replace(/\s+$/, ""));

  if (s.startsWith("{") || hasStoryBoilerplate(s)) {
    const inner = s.startsWith("{")
      ? s
          .replace(/^\{\s*/, "")
          .replace(/\}\s*$/, "")
          .replace(/\s+$/, "")
      : s;
    const returned = extractLastReturn(inner);
    if (returned) s = stripWrappingParens(returned);
  }

  return s;
}

/** Strip `render: () => (` wrappers and trailing `), };` from Storybook snippets. */
function stripWrappingParens(expr: string): string {
  let s = expr.replace(/^\n+/, "").replace(/\s+$/, "");
  s = s.replace(/,\s*\}?\s*;?\s*$/, "").replace(/\s+$/, "");
  s = s.replace(/;+\s*$/, "").replace(/\s+$/, "");

  while (s.startsWith("(")) {
    const close = findMatchingParen(s, 0);
    if (close === -1) break;
    const after = s
      .slice(close + 1)
      .replace(/^\s+/, "")
      .replace(/\s+$/, "");
    if (after === "" || /^[,;}\s]+$/.test(after)) {
      s = s.slice(1, close).replace(/^\n/, "").replace(/\s+$/, "");
      continue;
    }
    break;
  }

  return s;
}

/** Trailing `}`, `)`, and orphan `</StoryFrame>` lines Storybook often appends. */
function stripSnippetNoise(code: string): string {
  let lines = code.replace(/\s+$/, "").split("\n");

  while (lines.length > 0) {
    const last = lines[lines.length - 1];
    const t = last.trim();
    if (!t) {
      lines.pop();
      continue;
    }
    if (/^[\})\],;]+$/.test(t)) {
      lines.pop();
      continue;
    }
    if (LAYOUT_WRAPPER_TAGS.some((tag) => new RegExp(`^</${tag}>$`).test(t))) {
      lines.pop();
      continue;
    }
    break;
  }

  return lines.join("\n");
}

function stripOrphanLayoutCloses(jsx: string): string {
  let current = jsx.replace(/\s+$/, "");
  for (const tag of LAYOUT_WRAPPER_TAGS) {
    const close = `</${tag}>`;
    while (current.endsWith(close)) {
      current = current.slice(0, -close.length).replace(/\s+$/, "");
    }
  }
  return current;
}

function hasStoryBoilerplate(s: string): boolean {
  return (
    /use(?:State|Effect|Memo|Callback|Ref|Args)\b/.test(s) ||
    /^\s*const\s/m.test(s)
  );
}

function extractLastReturn(body: string): string | null {
  const idx = body.lastIndexOf("return");
  if (idx === -1) return null;

  let rest = body.slice(idx + "return".length).replace(/^\s+/, "");
  if (rest.startsWith("(")) {
    const close = findMatchingParen(rest, 0);
    if (close !== -1) {
      return rest.slice(1, close).replace(/^\n/, "").replace(/\s+$/, "");
    }
  }

  return rest.replace(/;+\s*$/, "").replace(/\s+$/, "");
}

function findMatchingParen(s: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < s.length; i++) {
    if (s[i] === "(") depth += 1;
    if (s[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function unwrapLayoutWrappers(jsx: string): string {
  let current = jsx.replace(/^\n+/, "").replace(/\s+$/, "");
  let prev = "";
  while (current !== prev) {
    prev = current;
    for (const tag of LAYOUT_WRAPPER_TAGS) {
      current = unwrapSingleTag(current, tag);
    }
  }
  return current;
}

function unwrapSingleTag(jsx: string, tagName: string): string {
  const openRe = new RegExp(`^\\s*<${tagName}(?:\\s[^>]*)?>\\n?`);
  const close = `</${tagName}>`;
  const open = jsx.match(openRe);
  if (!open) return jsx;
  let inner = jsx.slice(open[0].length).trimEnd();
  if (inner.endsWith(close)) {
    inner = inner.slice(0, -close.length).trimEnd();
  }
  return inner;
}

/** Opening/closing tags set the dedent baseline (not `margin: 0` or `}}>` continuations). */
function isTagLine(line: string): boolean {
  return /^\s*</.test(line);
}

function isOutputLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^[\})\],;]+$/.test(t)) return false;
  return true;
}

/**
 * Dedent by the shallowest content line's leading spaces, preserving relative indent.
 * Re-indent from scratch only when every line is flush-left (heuristic fallback).
 */
function formatSnippet(jsx: string): string {
  const normalized = jsx
    .replace(/\r\n/g, "\n")
    .replace(/^\n+/, "")
    .replace(/\s+$/, "");
  const lines = normalized.split("\n");
  const tagLines = lines.filter(isTagLine);
  if (tagLines.length === 0) return normalized;

  const min = Math.min(
    ...tagLines.map((line) => line.match(/^(\s*)/)?.[1].length ?? 0),
  );
  const dedented = lines
    .map((line) => {
      if (!isOutputLine(line)) return null;
      return line.slice(min).replace(/\s+$/, "");
    })
    .filter((line): line is string => line !== null);

  if (dedented.length <= 1) return dedented[0] ?? normalized;

  const hasRelativeIndent = dedented.some((line) => /^ +/.test(line));
  if (hasRelativeIndent) return dedented.join("\n");

  return reindentJsx(dedented);
}

/** Fallback when source has no leading whitespace (e.g. minified snippets). */
function reindentJsx(lines: string[]): string {
  let depth = 0;
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isClose = /^<\//.test(trimmed);
    const isSelfClosing =
      /\/>$/.test(trimmed) ||
      /^<[A-Za-z][\w.-]*[^>]*\/>$/.test(trimmed) ||
      /^<[A-Za-z][\w.-]*[^>]*>[\s\S]*<\/[A-Za-z][\w.-]*>\s*$/.test(trimmed);
    const isOpen =
      !isClose &&
      !isSelfClosing &&
      /^<[A-Za-z]/.test(trimmed) &&
      !trimmed.includes("</");

    if (isClose) depth = Math.max(0, depth - 1);

    result.push(`${"  ".repeat(depth)}${trimmed}`);

    if (isOpen) depth += 1;
  }

  return result.join("\n");
}
