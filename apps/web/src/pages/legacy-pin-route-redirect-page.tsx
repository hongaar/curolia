import { pinDetailHref } from "@/lib/app-paths";
import { resolveLegacyGlobalMapSlug } from "@/lib/resolve-map-slug";
import { StatusCenterMessage } from "@curolia/ui/status-center";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function LegacyPinRouteRedirectPage() {
  const { mapSlug, pinSlug } = useParams<{
    mapSlug: string;
    pinSlug: string;
  }>();
  const navigate = useNavigate();

  const destQuery = useQuery({
    queryKey: ["legacy-pin-route-redirect", mapSlug, pinSlug],
    queryFn: async () => {
      if (!mapSlug?.trim() || !pinSlug?.trim()) return null;
      const resolved = await resolveLegacyGlobalMapSlug(mapSlug);
      if (!resolved) return null;
      return pinDetailHref(
        {
          profileSlug: resolved.profileSlug,
          mapSlug: resolved.mapSlug,
        },
        pinSlug.trim(),
      );
    },
    enabled: Boolean(mapSlug?.trim() && pinSlug?.trim()),
  });

  useEffect(() => {
    if (!mapSlug?.trim() || !pinSlug?.trim()) return;
    if (destQuery.isPending) return;
    const path = destQuery.data;
    if (path) navigate(path, { replace: true });
  }, [mapSlug, pinSlug, navigate, destQuery.data, destQuery.isPending]);

  if (!mapSlug?.trim() || !pinSlug?.trim()) {
    return <StatusCenterMessage>Pin not found.</StatusCenterMessage>;
  }

  if (destQuery.isError || (!destQuery.isPending && !destQuery.data)) {
    return <StatusCenterMessage>Pin not found.</StatusCenterMessage>;
  }

  return <StatusCenterMessage>Redirecting…</StatusCenterMessage>;
}
