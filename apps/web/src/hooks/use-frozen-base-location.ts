/* eslint-disable react-hooks/set-state-in-effect -- persist last map/blog location for the stack base layer */
import { journalViewHref } from "@/lib/app-paths";
import { isBaseRoute } from "@/lib/stack-routes";
import { useJournal } from "@/providers/journal-provider";
import { useLayoutEffect, useMemo, useState } from "react";
import { useLocation, type Location } from "react-router-dom";

function defaultBasePathname(
  activeJournalSlug: string | undefined,
  fallbackJournalSlug: string | undefined,
): string {
  const slug = activeJournalSlug ?? fallbackJournalSlug;
  return slug ? journalViewHref("map", slug) : "/map";
}

/** Last map/blog location — kept mounted while stack screens are open. */
export function useFrozenBaseLocation(): Location {
  const location = useLocation();
  const { activeJournal, journals } = useJournal();
  const fallbackSlug = journals[0]?.slug;
  const defaultPathname = defaultBasePathname(
    activeJournal?.slug,
    fallbackSlug,
  );

  const [frozenBase, setFrozenBase] = useState(location);

  useLayoutEffect(() => {
    if (isBaseRoute(location.pathname)) {
      setFrozenBase(location);
    }
  }, [location]);

  const fallbackLocation = useMemo(
    (): Location => ({
      ...location,
      pathname: defaultPathname,
      search: "",
      hash: "",
      key: "stack-default-base",
      state: null,
    }),
    [defaultPathname, location],
  );

  if (isBaseRoute(location.pathname)) {
    return location;
  }

  if (isBaseRoute(frozenBase.pathname)) {
    return frozenBase;
  }

  return fallbackLocation;
}
