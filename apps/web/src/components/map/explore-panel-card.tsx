import type { ExploreCategory } from "@/lib/explore-categories";
import type { ExploreViewport } from "@/lib/explore-results";
import { useExplore } from "@/providers/explore-provider";
import type {
  ExploreFilterDef,
  ExploreResultEntry,
} from "@curolia/plugin-contract";
import { formatExploreDistanceMeters } from "@curolia/plugin-contract";
import {
  ExplorePanel,
  ExplorePanelActionButton,
  ExplorePanelBody,
  ExplorePanelDistanceFilter,
  ExplorePanelEntryButton,
  ExplorePanelEntryList,
  ExplorePanelFilterChip,
  ExplorePanelFilterGroup,
  ExplorePanelFilterLabel,
  ExplorePanelFilterRow,
  ExplorePanelHeader,
  ExplorePanelHeaderIcon,
  ExplorePanelHeaderTitle,
} from "@curolia/ui/explore-panel";
import { useMemo } from "react";

export function ExplorePanelCard({
  viewport = null,
  categoryById,
  entries: allEntries = [],
  isFetching = false,
  onGenerateRoutes,
  onSelectEntry,
}: {
  viewport?: ExploreViewport | null;
  categoryById: (id: string) => ExploreCategory | undefined;
  entries?: readonly ExploreResultEntry[];
  isFetching?: boolean;
  onGenerateRoutes?: () => void;
  onSelectEntry?: (entry: ExploreResultEntry) => void;
}) {
  const {
    cardExpanded,
    focusedCategoryId,
    getFilterValues,
    setFilterValue,
    setSelectedEntry,
  } = useExplore();

  const category = focusedCategoryId
    ? categoryById(focusedCategoryId)
    : undefined;
  const filterValues = focusedCategoryId
    ? getFilterValues(focusedCategoryId)
    : {};

  const entries = useMemo(
    () =>
      focusedCategoryId
        ? allEntries.filter((entry) => entry.categoryId === focusedCategoryId)
        : [],
    [allEntries, focusedCategoryId],
  );

  if (!cardExpanded || !focusedCategoryId || !category) {
    return null;
  }

  const filters = category.contribution.filters;
  const Icon = category.icon;
  const isRouteCategory = category.contribution.chipVariant === "route";
  const showLoading = isFetching && entries.length === 0;

  const handleSelect = (entry: ExploreResultEntry) => {
    setSelectedEntry(entry);
    onSelectEntry?.(entry);
  };

  return (
    <ExplorePanel expanded>
      <ExplorePanelHeader>
        <ExplorePanelHeaderIcon>
          <Icon aria-hidden />
        </ExplorePanelHeaderIcon>
        <ExplorePanelHeaderTitle>{category.label}</ExplorePanelHeaderTitle>
      </ExplorePanelHeader>
      <ExplorePanelBody>
        {filters.map((filter) =>
          renderFilter(filter, focusedCategoryId, filterValues, setFilterValue),
        )}
        {isRouteCategory ? (
          <ExplorePanelActionButton
            onClick={() => onGenerateRoutes?.()}
            disabled={isFetching || !viewport}
          >
            {isFetching ? "Generating…" : "Generate routes"}
          </ExplorePanelActionButton>
        ) : null}
        <ExplorePanelEntryList
          emptyLabel={showLoading ? "Loading…" : "No matches for this area."}
        >
          {entries.map((entry) => (
            <ExplorePanelEntryButton
              key={entry.id}
              title={entry.title}
              subtitle={entry.subtitle}
              meta={
                entry.distanceMeters != null
                  ? formatExploreDistanceMeters(entry.distanceMeters)
                  : undefined
              }
              onClick={() => handleSelect(entry)}
            />
          ))}
        </ExplorePanelEntryList>
      </ExplorePanelBody>
    </ExplorePanel>
  );
}

function renderFilter(
  filter: ExploreFilterDef,
  categoryId: string,
  filterValues: Record<string, string | readonly string[] | number>,
  setFilterValue: (
    categoryId: string,
    filterId: string,
    value: string | readonly string[] | number,
  ) => void,
) {
  if (filter.kind === "distance") {
    const value =
      typeof filterValues[filter.id] === "number"
        ? (filterValues[filter.id] as number)
        : filter.defaultValue;
    return (
      <ExplorePanelDistanceFilter
        key={filter.id}
        label={filter.label}
        valueMeters={value}
        minMeters={filter.minMeters}
        maxMeters={filter.maxMeters}
        stepMeters={filter.stepMeters}
        onChange={(next) => setFilterValue(categoryId, filter.id, next)}
      />
    );
  }

  const selected = filterValues[filter.id];
  const labelId = `explore-filter-${categoryId}-${filter.id}`;
  return (
    <ExplorePanelFilterGroup key={filter.id}>
      <ExplorePanelFilterLabel id={labelId}>
        {filter.label}
      </ExplorePanelFilterLabel>
      <ExplorePanelFilterRow labelledBy={labelId}>
        {filter.options.map((option) => {
          const active =
            filter.kind === "multi"
              ? Array.isArray(selected) && selected.includes(option.id)
              : selected === option.id;
          return (
            <ExplorePanelFilterChip
              key={option.id}
              label={option.label}
              active={active}
              onClick={() => {
                if (filter.kind === "multi") {
                  const current = Array.isArray(selected) ? [...selected] : [];
                  const next = current.includes(option.id)
                    ? current.filter((value) => value !== option.id)
                    : [...current, option.id];
                  setFilterValue(categoryId, filter.id, next);
                  return;
                }
                setFilterValue(categoryId, filter.id, option.id);
              }}
            />
          );
        })}
      </ExplorePanelFilterRow>
    </ExplorePanelFilterGroup>
  );
}
