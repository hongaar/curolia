import * as React from "react";

import {
  searchListOptionId,
  useSearchListKeyboard,
  type SearchListKeyboardItem,
} from "../../lib/use-search-list-keyboard";
import { cn } from "../../lib/utils";
import { Input } from "../input";
import { Popover, PopoverAnchor, PopoverContent } from "../popover";
import styles from "./search-combobox.module.css";

export type SearchComboboxItemPresentation = {
  title: string;
  meta?: string | null;
  imageUrl?: string | null;
};

export type SearchComboboxGroup<T> = {
  id: string;
  label: string;
  items: T[];
  /** Shown when the group has no items (e.g. link Spotify for library). */
  emptyMessage?: string;
};

export type SearchComboboxProps<T> = {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  minChars?: number;
  groups: SearchComboboxGroup<T>[];
  getItemKey: (item: T) => string;
  onSelect: (item: T) => void;
  renderItem: (item: T) => SearchComboboxItemPresentation;
  loadingMessage?: string;
  minCharsMessage?: string;
  emptyMessage?: string;
  errorMessage?: string | null;
  className?: string;
  listboxId?: string;
};

type FlatComboboxItem<T> = {
  groupId: string;
  item: T;
};

export function SearchCombobox<T>({
  query,
  onQueryChange,
  placeholder,
  disabled = false,
  loading = false,
  minChars = 2,
  groups,
  getItemKey,
  onSelect,
  renderItem,
  loadingMessage = "Searching…",
  minCharsMessage,
  emptyMessage = "No results",
  errorMessage = null,
  className,
  listboxId: listboxIdProp,
}: SearchComboboxProps<T>) {
  const generatedListboxId = React.useId();
  const listboxId = listboxIdProp ?? generatedListboxId;
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [anchorWidth, setAnchorWidth] = React.useState<number | null>(null);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= minChars;
  const needsMinChars = trimmed.length > 0 && trimmed.length < minChars;
  const totalItems = groups.reduce((n, g) => n + g.items.length, 0);

  const flatItems = React.useMemo((): FlatComboboxItem<T>[] => {
    const flat: FlatComboboxItem<T>[] = [];
    for (const group of groups) {
      for (const item of group.items) {
        flat.push({ groupId: group.id, item });
      }
    }
    return flat;
  }, [groups]);

  const handleSelect = React.useCallback(
    (item: T) => {
      onSelect(item);
      setOpen(false);
    },
    [onSelect],
  );

  const keyboardItems = React.useMemo((): SearchListKeyboardItem[] => {
    if (needsMinChars || loading || errorMessage || !canSearch) return [];
    return flatItems.map(({ groupId, item }) => ({
      id: `${groupId}:${getItemKey(item)}`,
      onSelect: () => handleSelect(item),
    }));
  }, [
    canSearch,
    errorMessage,
    flatItems,
    getItemKey,
    handleSelect,
    loading,
    needsMinChars,
  ]);

  const {
    handleInputKeyDown: handleSearchListKeyDown,
    getItemProps,
    inputProps: searchListInputProps,
  } = useSearchListKeyboard({
    listboxId,
    items: keyboardItems,
    enabled: open && !disabled,
  });

  const flatIndexByKey = React.useMemo(() => {
    const map = new Map<string, number>();
    flatItems.forEach(({ groupId, item }, index) => {
      map.set(`${groupId}:${getItemKey(item)}`, index);
    });
    return map;
  }, [flatItems, getItemKey]);

  React.useLayoutEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const sync = () => setAnchorWidth(el.offsetWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showPanel = open && !disabled && (needsMinChars || canSearch);

  return (
    <div className={cn(styles.root, className)}>
      <Popover
        open={showPanel}
        onOpenChange={(next) => {
          if (!disabled) setOpen(next);
        }}
      >
        <PopoverAnchor ref={anchorRef} className={styles.anchor}>
          <Input
            type="search"
            value={query}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              onQueryChange(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              handleSearchListKeyDown(e);
              if (e.key === "Escape") setOpen(false);
            }}
            aria-expanded={showPanel && keyboardItems.length > 0}
            {...searchListInputProps}
          />
        </PopoverAnchor>
        <PopoverContent
          anchor={anchorRef}
          align="start"
          side="bottom"
          sideOffset={8}
          className={styles.content}
          style={anchorWidth ? { width: anchorWidth } : undefined}
        >
          <div
            id={listboxId}
            role={keyboardItems.length > 0 ? "listbox" : "presentation"}
            className={styles.list}
          >
            {needsMinChars ? (
              <p className={styles.status}>
                {minCharsMessage ??
                  `Type at least ${minChars} characters to search.`}
              </p>
            ) : null}
            {!needsMinChars && loading ? (
              <p className={styles.status}>{loadingMessage}</p>
            ) : null}
            {!needsMinChars && errorMessage ? (
              <p className={cn(styles.status, styles.statusError)}>
                {errorMessage}
              </p>
            ) : null}
            {!needsMinChars && !loading && !errorMessage
              ? groups.map((group) => (
                  <div key={group.id} className={styles.group}>
                    <div className={styles.groupLabel}>{group.label}</div>
                    {group.items.length === 0 ? (
                      <p className={styles.groupEmpty}>
                        {group.emptyMessage ?? "No matches"}
                      </p>
                    ) : (
                      group.items.map((item) => {
                        const pres = renderItem(item);
                        const flatKey = `${group.id}:${getItemKey(item)}`;
                        const flatIndex = flatIndexByKey.get(flatKey);
                        const rowProps =
                          flatIndex == null
                            ? { active: false, onMouseMove: undefined }
                            : getItemProps(flatIndex);
                        const optionId =
                          flatIndex == null
                            ? undefined
                            : searchListOptionId(listboxId, flatKey);
                        return (
                          <button
                            key={getItemKey(item)}
                            type="button"
                            role="option"
                            id={optionId}
                            aria-selected={false}
                            className={cn(
                              styles.item,
                              rowProps.active && styles.itemActive,
                            )}
                            disabled={disabled}
                            onMouseMove={rowProps.onMouseMove}
                            onClick={() => handleSelect(item)}
                          >
                            {pres.imageUrl ? (
                              <img
                                src={pres.imageUrl}
                                alt=""
                                className={styles.itemArt}
                              />
                            ) : (
                              <span className={styles.itemArt} aria-hidden />
                            )}
                            <span className={styles.itemBody}>
                              <span className={styles.itemTitle}>
                                {pres.title}
                              </span>
                              {pres.meta ? (
                                <span className={styles.itemMeta}>
                                  {pres.meta}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                ))
              : null}
            {!needsMinChars &&
            !loading &&
            !errorMessage &&
            canSearch &&
            totalItems === 0 &&
            groups.every((g) => g.items.length === 0) ? (
              <p className={styles.status}>{emptyMessage}</p>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
