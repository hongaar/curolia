import { mapViewHref } from "@/lib/app-paths";
import { resolveLegacyGlobalMapSlug } from "@/lib/resolve-map-slug";
import { StatusCenterMessage } from "@curolia/ui/status-center";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

type LegacyMapRouteRedirectPageProps = {
  view: "map" | "blog";
};

export function LegacyMapRouteRedirectPage({
  view,
}: LegacyMapRouteRedirectPageProps) {
  const { mapSlug } = useParams<{ mapSlug: string }>();
  const navigate = useNavigate();

  const destQuery = useQuery({
    queryKey: ["legacy-map-route-redirect", view, mapSlug],
    queryFn: async () => {
      if (!mapSlug?.trim()) return null;
      const resolved = await resolveLegacyGlobalMapSlug(mapSlug);
      if (!resolved) return null;
      return mapViewHref(view, {
        profileSlug: resolved.profileSlug,
        mapSlug: resolved.mapSlug,
      });
    },
    enabled: Boolean(mapSlug?.trim()),
  });

  useEffect(() => {
    if (!mapSlug?.trim()) return;
    if (destQuery.isPending) return;
    const path = destQuery.data;
    if (path) navigate(path, { replace: true });
  }, [mapSlug, navigate, destQuery.data, destQuery.isPending]);

  if (!mapSlug?.trim()) {
    return <StatusCenterMessage>Map not found.</StatusCenterMessage>;
  }

  if (destQuery.isError || (!destQuery.isPending && !destQuery.data)) {
    return <StatusCenterMessage>Map not found.</StatusCenterMessage>;
  }

  return <StatusCenterMessage>Redirecting…</StatusCenterMessage>;
}
