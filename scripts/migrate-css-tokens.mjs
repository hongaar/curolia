#!/usr/bin/env node
/**
 * Migrates hardcoded rem/px values in CSS modules to design tokens.
 * Run from repo root: node scripts/migrate-css-tokens.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOTS = [
  "packages/ui/src/components",
  "packages/ui/src/storybook",
  "packages/site/src",
];

const REPLACEMENTS = [
  // Control heights (specific before generic spacing)
  [/height:\s*2\.25rem/g, "height: var(--control-h-md)"],
  [/min-height:\s*2\.25rem/g, "min-height: var(--control-h-md)"],
  [/max-height:\s*2\.25rem/g, "max-height: var(--control-h-md)"],
  [/height:\s*2rem(?![\d.])/g, "height: var(--control-h-sm)"],
  [/min-height:\s*2rem(?![\d.])/g, "min-height: var(--control-h-sm)"],
  [/height:\s*2\.5rem/g, "height: var(--control-h-lg)"],
  [/height:\s*2\.625rem/g, "height: var(--control-h-lg)"],
  [/height:\s*2\.75rem/g, "height: var(--control-h-lg)"],
  [/width:\s*2\.25rem/g, "width: var(--control-h-md)"],
  [/min-width:\s*2\.25rem/g, "min-width: var(--control-h-md)"],
  [/max-width:\s*2\.25rem/g, "max-width: var(--control-h-md)"],
  [/width:\s*2rem(?![\d.])/g, "width: var(--control-h-sm)"],
  [/width:\s*2\.5rem/g, "width: var(--control-h-lg)"],
  [/width:\s*1rem/g, "width: var(--icon-size-md)"],
  [/height:\s*1rem/g, "height: var(--icon-size-md)"],
  [/width:\s*0\.875rem/g, "width: var(--icon-size-sm)"],
  [/height:\s*0\.875rem/g, "height: var(--icon-size-sm)"],
  [/width:\s*0\.75rem/g, "width: var(--icon-size-sm)"],
  [/height:\s*0\.75rem/g, "height: var(--icon-size-sm)"],
  [/width:\s*1\.25rem/g, "width: var(--icon-size-lg)"],
  [/height:\s*1\.25rem/g, "height: var(--icon-size-lg)"],
  [/width:\s*1\.75rem/g, "width: var(--control-h-sm)"],
  [/height:\s*1\.75rem/g, "height: var(--control-h-sm)"],
  [/width:\s*1\.5rem/g, "width: var(--control-h-sm)"],
  [/height:\s*1\.5rem/g, "height: var(--control-h-sm)"],
  // Font sizes
  [/font-size:\s*0\.625rem/g, "font-size: var(--font-size-xs)"],
  [/font-size:\s*0\.6875rem/g, "font-size: var(--font-size-xs)"],
  [/font-size:\s*0\.75rem/g, "font-size: var(--font-size-xs)"],
  [/font-size:\s*0\.8125rem/g, "font-size: var(--font-size-sm)"],
  [/font-size:\s*0\.875rem/g, "font-size: var(--font-size-sm)"],
  [/font-size:\s*1rem(?![\d.])/g, "font-size: var(--font-size-base)"],
  [/font-size:\s*1\.125rem/g, "font-size: var(--font-size-lg)"],
  [/font-size:\s*1\.25rem/g, "font-size: var(--font-size-xl)"],
  [/font-size:\s*1\.5rem/g, "font-size: var(--font-size-2xl)"],
  [/font-size:\s*1\.875rem/g, "font-size: var(--font-size-3xl)"],
  [/font-size:\s*2\.25rem/g, "font-size: var(--font-size-4xl)"],
  // Font weights
  [/font-weight:\s*400/g, "font-weight: var(--font-weight-normal)"],
  [/font-weight:\s*500/g, "font-weight: var(--font-weight-medium)"],
  [/font-weight:\s*600/g, "font-weight: var(--font-weight-semibold)"],
  [/font-weight:\s*700/g, "font-weight: var(--font-weight-bold)"],
  // Line heights
  [/line-height:\s*1\.2/g, "line-height: var(--line-height-tight)"],
  [/line-height:\s*1\.25/g, "line-height: var(--line-height-snug)"],
  [/line-height:\s*1\.35/g, "line-height: var(--line-height-snug)"],
  [/line-height:\s*1\.5/g, "line-height: var(--line-height-normal)"],
  [/line-height:\s*1\.625/g, "line-height: var(--line-height-relaxed)"],
  // Spacing - padding/margin/gap (largest first)
  [/gap:\s*4rem/g, "gap: var(--space-12)"],
  [/gap:\s*3\.5rem/g, "gap: var(--space-11)"],
  [/gap:\s*3rem/g, "gap: var(--space-10)"],
  [/gap:\s*2\.5rem/g, "gap: var(--space-9)"],
  [/gap:\s*2rem/g, "gap: var(--space-8)"],
  [/gap:\s*1\.75rem/g, "gap: var(--space-7)"],
  [/gap:\s*1\.5rem/g, "gap: var(--space-6)"],
  [/gap:\s*1\.25rem/g, "gap: var(--space-5)"],
  [/gap:\s*1rem/g, "gap: var(--space-4)"],
  [/gap:\s*0\.75rem/g, "gap: var(--space-3)"],
  [/gap:\s*0\.5rem/g, "gap: var(--space-2)"],
  [/gap:\s*0\.375rem/g, "gap: var(--space-2)"],
  [/gap:\s*0\.25rem/g, "gap: var(--space-1)"],
  [/padding:\s*1\.5rem/g, "padding: var(--space-6)"],
  [/padding:\s*1\.25rem/g, "padding: var(--space-5)"],
  [/padding:\s*1rem/g, "padding: var(--space-4)"],
  [/padding:\s*0\.75rem/g, "padding: var(--space-3)"],
  [/padding:\s*0\.5rem/g, "padding: var(--space-2)"],
  [/padding:\s*0\.25rem/g, "padding: var(--space-1)"],
  [/padding-block:\s*0\.5rem/g, "padding-block: var(--space-2)"],
  [/padding-block:\s*1\.5rem/g, "padding-block: var(--space-6)"],
  [/padding-inline:\s*0\.75rem/g, "padding-inline: var(--space-3)"],
  [/padding-inline:\s*0\.625rem/g, "padding-inline: var(--space-3)"],
  [/padding-inline:\s*0\.875rem/g, "padding-inline: var(--space-3)"],
  [/padding-inline:\s*1\.25rem/g, "padding-inline: var(--space-5)"],
  [/padding-inline:\s*1\.5rem/g, "padding-inline: var(--space-6)"],
  [/padding-top:\s*0\.75rem/g, "padding-top: var(--space-3)"],
  [/padding-right:\s*0\.75rem/g, "padding-right: var(--space-3)"],
  [/padding-left:\s*0\.75rem/g, "padding-left: var(--space-3)"],
  [/padding-bottom:\s*0\.75rem/g, "padding-bottom: var(--space-3)"],
  [/margin-top:\s*0\.125rem/g, "margin-top: var(--space-1)"],
  [/margin-top:\s*0\.25rem/g, "margin-top: var(--space-1)"],
  [/margin-top:\s*0\.5rem/g, "margin-top: var(--space-2)"],
  [/margin-top:\s*1rem/g, "margin-top: var(--space-4)"],
  [/margin-bottom:\s*0\.5rem/g, "margin-bottom: var(--space-2)"],
  [/margin-bottom:\s*1rem/g, "margin-bottom: var(--space-4)"],
  [/margin:\s*0\.25rem/g, "margin: var(--space-1)"],
  [/top:\s*0\.5rem/g, "top: var(--space-2)"],
  [/right:\s*0\.5rem/g, "right: var(--space-2)"],
  [/left:\s*0\.5rem/g, "left: var(--space-2)"],
  [/top:\s*0\.75rem/g, "top: var(--space-3)"],
  [/right:\s*0\.75rem/g, "right: var(--space-3)"],
  // Border radius
  [/border-radius:\s*9999px/g, "border-radius: var(--radius-full)"],
  // Already tokenized - skip duplicates
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (entry.endsWith(".module.css")) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const root of ROOTS) {
  const files = walk(root);
  for (const file of files) {
    let content = readFileSync(file, "utf8");
    const original = content;
    for (const [pattern, replacement] of REPLACEMENTS) {
      content = content.replace(pattern, replacement);
    }
    if (content !== original) {
      writeFileSync(file, content);
      changed++;
      console.log("Updated:", file);
    }
  }
}
console.log(`\nDone. ${changed} files updated.`);
