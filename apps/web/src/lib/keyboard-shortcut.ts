export type ShortcutBinding = {
  key: string;
  shift?: boolean;
  alt?: boolean;
};

export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = nav.userAgentData?.platform ?? nav.platform ?? "";
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

export function formatShortcutKeys(
  shortcut: ShortcutBinding,
  isApple = isApplePlatform(),
): string[] {
  const mod = isApple ? "⌘" : "Ctrl";
  const keys: string[] = [mod];
  if (shortcut.shift) keys.push(isApple ? "⇧" : "Shift");
  if (shortcut.alt) keys.push(isApple ? "⌥" : "Alt");
  keys.push(
    shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key,
  );
  return keys;
}

export function formatShortcutLabel(
  shortcut: ShortcutBinding,
  isApple = isApplePlatform(),
): string {
  const keys = formatShortcutKeys(shortcut, isApple);
  return isApple ? keys.join("") : keys.join("+");
}

export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutBinding,
): boolean {
  const mod = event.metaKey || event.ctrlKey;
  if (!mod) return false;
  if (Boolean(shortcut.shift) !== event.shiftKey) return false;
  if (Boolean(shortcut.alt) !== event.altKey) return false;
  return event.key.toLowerCase() === shortcut.key.toLowerCase();
}

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}
