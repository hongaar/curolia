import { act, renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  searchListOptionId,
  useSearchListKeyboard,
} from "./use-search-list-keyboard";

describe("searchListOptionId", () => {
  it("prefixes option ids with the listbox id", () => {
    expect(searchListOptionId("places", "abc")).toBe("places-option-abc");
  });
});

describe("useSearchListKeyboard", () => {
  it("moves active index with arrow keys and selects on Enter", () => {
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    const items = [
      { id: "a", onSelect: onFirst },
      { id: "b", onSelect: onSecond },
    ];

    const { result } = renderHook(() =>
      useSearchListKeyboard({ listboxId: "demo", items }),
    );

    act(() => {
      result.current.handleInputKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent);
    });
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.activeDescendantId).toBe("demo-option-a");

    act(() => {
      result.current.handleInputKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent);
    });
    expect(result.current.activeIndex).toBe(1);

    act(() => {
      result.current.handleInputKeyDown({
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent);
    });
    expect(onSecond).toHaveBeenCalledTimes(1);
  });

  it("resets active index when items change", () => {
    const { result, rerender } = renderHook(
      ({ items }) => useSearchListKeyboard({ listboxId: "demo", items }),
      {
        initialProps: {
          items: [{ id: "a", onSelect: vi.fn() }],
        },
      },
    );

    act(() => {
      result.current.handleInputKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent);
    });
    expect(result.current.activeIndex).toBe(0);

    rerender({ items: [{ id: "b", onSelect: vi.fn() }] });
    expect(result.current.activeIndex).toBe(-1);
  });
});
