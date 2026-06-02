import { normalizeUrlInput } from "@/lib/pin-links";

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "file",
  "hidden",
  "image",
  "radio",
  "reset",
  "submit",
]);

/** Whether a lone URL paste should stay in the focused field (not used for image paste). */
export function isPinFormTextEntryPasteTarget(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof Element)) return false;
  const field = target.closest(
    "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
  );
  if (!field) return false;
  if (field instanceof HTMLInputElement) {
    if (NON_TEXT_INPUT_TYPES.has(field.type.toLowerCase())) return false;
  }
  return true;
}

/** First image file on the clipboard, if any. */
export function fileFromClipboardData(data: DataTransfer): File | null {
  if (data.files.length > 0) {
    const file = data.files[0];
    if (file.type.startsWith("image/")) return file;
  }
  for (const item of data.items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      return item.getAsFile();
    }
  }
  return null;
}

/** Normalized http(s) URL when plain text is a single URL only. */
export function urlFromClipboardText(text: string): string | null {
  if (!text || /[\r\n]/.test(text)) return null;
  const trimmed = text.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  return normalizeUrlInput(trimmed);
}

/** Normalized http(s) URL when clipboard plain text is a single URL only. */
export function urlFromClipboardData(data: DataTransfer): string | null {
  return urlFromClipboardText(data.getData("text/plain"));
}
