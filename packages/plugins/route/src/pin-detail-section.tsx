import type { PinContextProps } from "@curolia/plugin-contract";
import { useQuery } from "@tanstack/react-query";

type RoutePinData = {
  schemaVersion: number;
  profile: string;
  distanceMeters: number;
  ascentMeters?: number;
  durationSeconds?: number;
  coordinates: [number, number][];
};

export function RoutePinDetailSection({
  supabase,
  pinId,
  mapId,
}: PinContextProps) {
  const query = useQuery({
    queryKey: ["route-pin-data", pinId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_entity_data")
        .select("data")
        .eq("entity_type", "pin")
        .eq("entity_id", pinId)
        .eq("plugin_type_id", "route")
        .maybeSingle();
      if (error) throw error;
      return (data?.data ?? null) as RoutePinData | null;
    },
    enabled: Boolean(pinId && mapId),
  });

  const route = query.data;
  if (!route?.coordinates?.length) return null;

  const distanceKm = (route.distanceMeters / 1000).toFixed(1);

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Saved route
      </h3>
      <p className="text-sm">
        {route.profile} · {distanceKm} km
        {route.ascentMeters != null
          ? ` · ${Math.round(route.ascentMeters)} m ascent`
          : ""}
      </p>
    </section>
  );
}
