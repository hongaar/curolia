import { pinDetailHref } from "@/lib/app-paths";
import { PIN_ID_PARAM_RE } from "@/lib/map-view-params";
import { supabase } from "@/lib/supabase";
import { StatusCenterMessage } from "@curolia/ui/status-center";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function PinLegacyRedirectPage() {
  const { legacyPinId } = useParams<{ legacyPinId: string }>();
  const navigate = useNavigate();

  const destQuery = useQuery({
    queryKey: ["pin-legacy-redirect", legacyPinId],
    queryFn: async () => {
      if (!legacyPinId || !PIN_ID_PARAM_RE.test(legacyPinId)) return null;
      const { data: row, error } = await supabase
        .from("pins")
        .select("slug, map_id")
        .eq("id", legacyPinId)
        .maybeSingle();
      if (error) throw error;
      if (!row) return null;
      const { data: map, error: jErr } = await supabase
        .from("maps")
        .select("slug")
        .eq("id", row.map_id)
        .maybeSingle();
      if (jErr) throw jErr;
      const js = map?.slug?.trim();
      if (!js) return null;
      return pinDetailHref(js, row.slug);
    },
    enabled: Boolean(legacyPinId && PIN_ID_PARAM_RE.test(legacyPinId)),
  });

  useEffect(() => {
    if (!legacyPinId || !PIN_ID_PARAM_RE.test(legacyPinId)) return;
    if (destQuery.isPending) return;
    const path = destQuery.data;
    if (path) navigate(path, { replace: true });
  }, [legacyPinId, navigate, destQuery.data, destQuery.isPending]);

  if (!legacyPinId || !PIN_ID_PARAM_RE.test(legacyPinId)) {
    return <StatusCenterMessage>Pin not found.</StatusCenterMessage>;
  }

  if (destQuery.isError || (!destQuery.isPending && !destQuery.data)) {
    return <StatusCenterMessage>Pin not found.</StatusCenterMessage>;
  }

  return <StatusCenterMessage>Redirecting…</StatusCenterMessage>;
}
