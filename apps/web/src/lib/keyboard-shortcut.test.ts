import { describe, expect, it } from "vitest";
import {
  formatShortcutKeys,
  formatShortcutLabel,
  matchesShortcut,
} from "./keyboard-shortcut";

describe("formatShortcutKeys", () => {
  it("returns individual key labels", () => {
    expect(formatShortcutKeys({ key: "k" }, true)).toEqual(["⌘", "K"]);
    expect(formatShortcutKeys({ key: "m", shift: true }, true)).toEqual([
      "⌘",
      "⇧",
      "M",
    ]);
    expect(formatShortcutKeys({ key: "p", shift: true }, false)).toEqual([
      "Ctrl",
      "Shift",
      "P",
    ]);
  });
});

describe("formatShortcutLabel", () => {
  it("formats mac shortcuts", () => {
    expect(formatShortcutLabel({ key: "k" }, true)).toBe("⌘K");
    expect(formatShortcutLabel({ key: ",", shift: true }, true)).toBe("⌘⇧,");
  });

  it("formats windows shortcuts", () => {
    expect(formatShortcutLabel({ key: "k" }, false)).toBe("Ctrl+K");
    expect(formatShortcutLabel({ key: "p", shift: true }, false)).toBe(
      "Ctrl+Shift+P",
    );
  });
});

describe("matchesShortcut", () => {
  it("matches modifier shortcuts", () => {
    const event = {
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      key: "k",
    } as KeyboardEvent;
    expect(matchesShortcut(event, { key: "k" })).toBe(true);
    expect(matchesShortcut(event, { key: "p", shift: true })).toBe(false);
  });
});
