import { EmptyMapState } from "@/components/root/empty-map-state";
import { resolveMemberMapHomeHref } from "@/lib/member-map-home";
import { getStoredActiveMapId } from "@/providers/auth-provider";
import { useMap } from "@/providers/map-provider";
import { CuroliaLoadingSplash } from "@curolia/ui/loading-splash";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Signed-in `/` — redirect to the active map or show an empty-state CTA. */
export function RootMapRedirect() {
  const navigate = useNavigate();
  const { memberMaps, loading } = useMap();

  const homeHref =
    memberMaps.length > 0
      ? resolveMemberMapHomeHref(memberMaps, getStoredActiveMapId())
      : null;

  useEffect(() => {
    if (loading || !homeHref || homeHref === "/") return;
    navigate(homeHref, { replace: true });
  }, [homeHref, loading, navigate]);

  if (loading) {
    return <CuroliaLoadingSplash fill statusLabel="Loading your map" />;
  }

  if (!homeHref || homeHref === "/") {
    return <EmptyMapState />;
  }

  return <CuroliaLoadingSplash fill statusLabel="Opening your map" />;
}
