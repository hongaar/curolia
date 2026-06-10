import * as React from "react";

export type SearchListKeyboardItem = {
  id: string;
  onSelect: () => void;
  disabled?: boolean;
};

export function searchListOptionId(
  listboxId: string,
  optionId: string,
): string {
  return `${listboxId}-option-${optionId}`;
}

function selectableIndices(items: SearchListKeyboardItem[]): number[] {
  const indices: number[] = [];
  for (let index = 0; index < items.length; index += 1) {
    if (!items[index]?.disabled) indices.push(index);
  }
  return indices;
}

export function useSearchListKeyboard({
  listboxId,
  items,
  enabled = true,
}: {
  listboxId: string;
  items: SearchListKeyboardItem[];
  enabled?: boolean;
}) {
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const itemsRef = React.useRef(items);
  itemsRef.current = items;

  const itemsKey = React.useMemo(
    () => items.map((item) => item.id).join("\0"),
    [items],
  );

  React.useEffect(() => {
    setActiveIndex(-1);
  }, [itemsKey]);

  const indices = React.useMemo(() => selectableIndices(items), [items]);

  const moveActive = React.useCallback(
    (delta: number) => {
      if (indices.length === 0) return;
      setActiveIndex((prev) => {
        if (prev < 0) {
          return delta > 0 ? indices[0]! : indices[indices.length - 1]!;
        }
        const position = indices.indexOf(prev);
        if (position < 0) return indices[0]!;
        const nextPosition =
          (position + delta + indices.length) % indices.length;
        return indices[nextPosition]!;
      });
    },
    [indices],
  );

  const activeDescendantId =
    activeIndex >= 0 && items[activeIndex]
      ? searchListOptionId(listboxId, items[activeIndex]!.id)
      : undefined;

  React.useEffect(() => {
    if (!enabled || !activeDescendantId) return;
    document.getElementById(activeDescendantId)?.scrollIntoView({
      block: "nearest",
    });
  }, [activeDescendantId, enabled]);

  const handleInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled || indices.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActive(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(-1);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(indices[0]!);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(indices[indices.length - 1]!);
        return;
      }

      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        itemsRef.current[activeIndex]?.onSelect();
      }
    },
    [activeIndex, enabled, indices, moveActive],
  );

  const getItemProps = React.useCallback(
    (index: number) => {
      const item = items[index];
      return {
        id: item ? searchListOptionId(listboxId, item.id) : undefined,
        active: activeIndex === index,
        onMouseMove: () => {
          if (!item?.disabled && activeIndex !== index) {
            setActiveIndex(index);
          }
        },
      };
    },
    [activeIndex, items, listboxId],
  );

  const inputProps = React.useMemo(
    () => ({
      role: "combobox" as const,
      "aria-autocomplete": "list" as const,
      "aria-controls": listboxId,
      "aria-activedescendant": activeDescendantId,
    }),
    [activeDescendantId, listboxId],
  );

  return {
    activeIndex,
    activeDescendantId,
    handleInputKeyDown,
    getItemProps,
    inputProps,
    hasItems: indices.length > 0,
  };
}
