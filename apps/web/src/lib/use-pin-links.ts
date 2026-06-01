import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PinLink } from "@/types/database";

export function usePinLinks(pinId: string | undefined) {
  return useQuery({
    queryKey: ["pin-links", pinId],
    queryFn: async () => {
      if (!pinId) return [] as PinLink[];
      const { data, error } = await supabase
        .from("pin_links")
        .select("*")
        .eq("pin_id", pinId)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as PinLink[];
    },
    enabled: Boolean(pinId),
  });
}
