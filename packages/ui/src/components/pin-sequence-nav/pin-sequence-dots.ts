import type { PinSequenceNavItem } from "./pin-sequence-nav";

/** Pin dots shown around the current stop (current ± radius). */
export const PIN_SEQUENCE_DOT_RADIUS = 2;

export type PinSequenceDotSegment =
  | {
      kind: "pin";
      index: number;
      item: PinSequenceNavItem;
    }
  | {
      kind: "collapsed";
      side: "left" | "right";
      count: number;
      /** Index to jump to when the collapsed control is activated. */
      targetIndex: number;
    };

export function pinSequenceMaxVisibleDots(
  radius = PIN_SEQUENCE_DOT_RADIUS,
): number {
  return radius * 2 + 1;
}

/** Window pin dots around `currentIndex`; hide distant stops behind collapsed markers. */
export function buildPinSequenceDotSegments(
  items: PinSequenceNavItem[],
  currentIndex: number,
  radius = PIN_SEQUENCE_DOT_RADIUS,
): PinSequenceDotSegment[] {
  const total = items.length;
  if (total === 0) return [];

  const maxVisible = pinSequenceMaxVisibleDots(radius);
  if (total <= maxVisible) {
    return items.map((item, index) => ({ kind: "pin", index, item }));
  }

  let start = Math.max(0, currentIndex - radius);
  let end = Math.min(total - 1, currentIndex + radius);

  while (end - start + 1 < maxVisible) {
    if (start > 0) {
      start -= 1;
    } else if (end < total - 1) {
      end += 1;
    } else {
      break;
    }
  }

  const segments: PinSequenceDotSegment[] = [];

  if (start > 0) {
    segments.push({
      kind: "collapsed",
      side: "left",
      count: start,
      targetIndex: start - 1,
    });
  }

  for (let index = start; index <= end; index += 1) {
    segments.push({ kind: "pin", index, item: items[index]! });
  }

  if (end < total - 1) {
    segments.push({
      kind: "collapsed",
      side: "right",
      count: total - 1 - end,
      targetIndex: end + 1,
    });
  }

  return segments;
}
