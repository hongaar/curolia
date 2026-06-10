import { describe, expect, it } from "vitest";

import type { PinSequenceNavItem } from "./pin-sequence-nav";
import { buildPinSequenceDotSegments } from "./pin-sequence-dots";

function item(id: string): PinSequenceNavItem {
  return { id, title: id, color: "#2d6a5d" };
}

describe("buildPinSequenceDotSegments", () => {
  it("returns all pins when the sequence is short", () => {
    const items = [item("a"), item("b"), item("c")];
    expect(buildPinSequenceDotSegments(items, 1)).toEqual([
      { kind: "pin", index: 0, item: items[0] },
      { kind: "pin", index: 1, item: items[1] },
      { kind: "pin", index: 2, item: items[2] },
    ]);
  });

  it("collapses distant pins around the current stop", () => {
    const items = Array.from({ length: 8 }, (_, i) => item(String(i)));
    expect(buildPinSequenceDotSegments(items, 4)).toEqual([
      {
        kind: "collapsed",
        side: "left",
        count: 2,
        targetIndex: 1,
      },
      { kind: "pin", index: 2, item: items[2] },
      { kind: "pin", index: 3, item: items[3] },
      { kind: "pin", index: 4, item: items[4] },
      { kind: "pin", index: 5, item: items[5] },
      { kind: "pin", index: 6, item: items[6] },
      {
        kind: "collapsed",
        side: "right",
        count: 1,
        targetIndex: 7,
      },
    ]);
  });

  it("only collapses on the right at the start of a long sequence", () => {
    const items = Array.from({ length: 8 }, (_, i) => item(String(i)));
    expect(
      buildPinSequenceDotSegments(items, 0).map((segment) => segment.kind),
    ).toEqual(["pin", "pin", "pin", "pin", "pin", "collapsed"]);
  });
});
