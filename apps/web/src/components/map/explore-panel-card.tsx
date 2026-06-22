import type { ExploreCategory } from "@/lib/explore-categories";
import { fetchExploreCategoryResults } from "@/lib/explore-results";
import { useExplore } from "@/providers/explore-provider";
import { formatExploreDistanceMeters } from "@curolia/plugin-contract";
import {
  ExplorePanel,
  ExplorePanelBody,
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
import { useQuery } from "@tanstack/react-query";

export function ExplorePanelCard({
  mapCenter = null,
  categoryById,
}: {
  mapCenter?: { lng: number; lat: number } | null;
  categoryById: (id: string) => ExploreCategory | undefined;
}) {
  const { cardExpanded, focusedCategoryId, getFilterValues, setFilterValue } =
    useExplore();

  if (!cardExpanded || !focusedCategoryId) {
    return null;
  }

  const category = categoryById(focusedCategoryId);
  if (!category) return null;

  const filters = category.contribution.filters;
  const filterValues = getFilterValues(focusedCategoryId);
  const Icon = category.icon;

  const resultsQuery = useQuery({
    queryKey: [
      "explore-results",
      focusedCategoryId,
      filterValues,
      mapCenter?.lng,
      mapCenter?.lat,
    ],
    queryFn: () =>
      fetchExploreCategoryResults(focusedCategoryId, filterValues, mapCenter),
  });

  const entries = resultsQuery.data ?? [];

  return (
    <ExplorePanel expanded>
      <ExplorePanelHeader>
        <ExplorePanelHeaderIcon>
          <Icon aria-hidden />
        </ExplorePanelHeaderIcon>
        <ExplorePanelHeaderTitle>{category.label}</ExplorePanelHeaderTitle>
      </ExplorePanelHeader>
      <ExplorePanelBody>
        {filters.map((filter) => {
          const labelId = `explore-filter-${focusedCategoryId}-${filter.id}`;
          const selected = filterValues[filter.id];
          return (
            <ExplorePanelFilterGroup key={filter.id}>
              <ExplorePanelFilterLabel id={labelId}>
                {filter.label}
              </ExplorePanelFilterLabel>
              <ExplorePanelFilterRow labelledBy={labelId}>
                {filter.options.map((option) => {
                  const active =
                    filter.kind === "single"
                      ? selected === option.id
                      : Array.isArray(selected) && selected.includes(option.id);
                  return (
                    <ExplorePanelFilterChip
                      key={option.id}
                      label={option.label}
                      active={active}
                      onClick={() => {
                        if (filter.kind === "single") {
                          setFilterValue(
                            focusedCategoryId,
                            filter.id,
                            option.id,
                          );
                          return;
                        }
                        const current = Array.isArray(selected)
                          ? [...selected]
                          : [];
                        const next = current.includes(option.id)
                          ? current.filter((value) => value !== option.id)
                          : [...current, option.id];
                        setFilterValue(focusedCategoryId, filter.id, next);
                      }}
                    />
                  );
                })}
              </ExplorePanelFilterRow>
            </ExplorePanelFilterGroup>
          );
        })}
        <ExplorePanelEntryList>
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
            />
          ))}
        </ExplorePanelEntryList>
      </ExplorePanelBody>
    </ExplorePanel>
  );
}
