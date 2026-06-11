import { supabase } from "@/lib/supabase";
import { useEnabledPlugins } from "@/lib/use-enabled-plugins";
import { useAuth } from "@/providers/auth-provider";
import type { Pin } from "@/types/database";
import type { PinDetailActionProps } from "@curolia/plugin-contract";

type PinPluginDetailActionsPin = Pick<
  Pin,
  "id" | "map_id" | "lat" | "lng" | "title" | "date" | "end_date"
>;

export function PinPluginDetailActions({
  pin,
  surface,
}: {
  pin: PinPluginDetailActionsPin;
  surface: PinDetailActionProps["surface"];
}) {
  const { user } = useAuth();
  const { plugins: enabledPlugins } = useEnabledPlugins();

  return (
    <>
      {enabledPlugins.map((p) => {
        const Action = p.PinDetailAction;
        if (!Action) return null;
        return (
          <Action
            key={`action-${p.id}`}
            supabase={supabase}
            userId={user?.id}
            pinId={pin.id}
            mapId={pin.map_id}
            pinDate={pin.date}
            pinEndDate={pin.end_date}
            pinLat={pin.lat}
            pinLng={pin.lng}
            pinTitle={pin.title}
            surface={surface}
          />
        );
      })}
    </>
  );
}

export function hasPinPluginDetailActions(
  plugins: ReadonlyArray<{ PinDetailAction?: unknown }>,
): boolean {
  return countPinPluginDetailActions(plugins) > 0;
}

export function countPinPluginDetailActions(
  plugins: ReadonlyArray<{ PinDetailAction?: unknown }>,
): number {
  return plugins.filter((plugin) => Boolean(plugin.PinDetailAction)).length;
}
