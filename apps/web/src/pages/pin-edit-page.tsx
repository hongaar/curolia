import { PageBackButton } from "@/components/layout/page-back-button";
import { useMapMemberRole } from "@/hooks/use-map-access";
import { pinEditHref } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import { resolvePinByMapSlug } from "@/lib/resolve-pin-slug";
import { supabase } from "@/lib/supabase";
import { useMap } from "@/providers/map-provider";
import type { Pin } from "@/types/database";
import { Button } from "@curolia/ui/button";
import {
  AppPageLayout,
  PageCenteredError,
  PageCenteredLoading,
  PagePanel,
} from "@curolia/ui/page";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PinFormDialog = lazy(() =>
  import("@/components/pins/pin-form-dialog").then((m) => ({
    default: m.PinFormDialog,
  })),
);

export function PinEditPage() {
  const { profileSlug, mapSlug, pinSlug } = useParams<{
    profileSlug: string;
    mapSlug: string;
    pinSlug: string;
  }>();
  const navigate = useNavigate();
  const { maps, activeMapId } = useMap();

  const mapForRoute = useMemo(() => {
    if (!profileSlug?.trim() || !mapSlug?.trim()) return null;
    const profileNeedle = profileSlug.trim().toLowerCase();
    const mapNeedle = mapSlug.trim().toLowerCase();
    return (
      maps.find(
        (j) =>
          j.owner_profile_slug.trim().toLowerCase() === profileNeedle &&
          j.slug.trim().toLowerCase() === mapNeedle,
      ) ?? null
    );
  }, [maps, profileSlug, mapSlug]);

  const pinQuery = useQuery({
    queryKey: ["pin-edit", mapForRoute?.id, pinSlug],
    queryFn: async () => {
      if (!mapForRoute || !pinSlug?.trim()) return null;
      const resolved = await resolvePinByMapSlug(mapForRoute.id, pinSlug);
      if (!resolved) return null;
      const { data, error } = await supabase
        .from("pins")
        .select("*")
        .eq("id", resolved.pinId)
        .maybeSingle();
      if (error) throw error;
      const row = data as Pin | null;
      if (!row) return null;
      return {
        row,
        redirectSlug: resolved.redirected ? resolved.canonicalSlug : null,
      };
    },
    enabled: Boolean(mapForRoute && pinSlug?.trim()),
  });

  const pin = pinQuery.data?.row ?? null;
  const redirectSlug = pinQuery.data?.redirectSlug ?? null;
  const mapRoute = useMemo(
    () => (mapForRoute ? mapRouteForMap(mapForRoute) : null),
    [mapForRoute],
  );
  const { canEdit, isLoading: roleLoading } = useMapMemberRole(pin?.map_id);

  useEffect(() => {
    if (!redirectSlug || !mapRoute) return;
    navigate(pinEditHref(mapRoute, redirectSlug), { replace: true });
  }, [redirectSlug, mapRoute, navigate]);

  const closeEditor = () => {
    navigate(-1);
  };

  if (pinQuery.isLoading || roleLoading) {
    return <PageCenteredLoading>Loading pin…</PageCenteredLoading>;
  }

  const wrongMap = pin && activeMapId && pin.map_id !== activeMapId;

  if (!pin || wrongMap || !canEdit) {
    return (
      <PageCenteredError
        actions={
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      >
        Pin not found or you cannot edit it.
      </PageCenteredError>
    );
  }

  return (
    <AppPageLayout width="2xl">
      <PageBackButton />
      <PagePanel>
        <Suspense fallback={null}>
          <PinFormDialog
            layout="page"
            open
            onOpenChange={(open) => {
              if (!open) closeEditor();
            }}
            mapId={pin.map_id}
            pin={pin}
          />
        </Suspense>
      </PagePanel>
    </AppPageLayout>
  );
}
