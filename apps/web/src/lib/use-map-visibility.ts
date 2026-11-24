import { supabase } from "@/lib/supabase";
import { VISIBILITY_LABELS, type Visibility } from "@/lib/visibility";
import { useAuth } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useMapVisibility(map: { id: string; slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [visibilityBusy, setVisibilityBusy] = useState(false);

  async function setVisibility(
    visibility: Visibility,
    options?: { silent?: boolean },
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    setVisibilityBusy(true);
    const { error } = await supabase.rpc("set_map_visibility", {
      p_map_id: map.id,
      p_visibility: visibility,
    });
    setVisibilityBusy(false);
    if (error) {
      if (!options?.silent) toast.error(error.message);
      return { ok: false, error: error.message };
    }
    if (!options?.silent) {
      toast.success(
        `Map is now ${VISIBILITY_LABELS[visibility].toLowerCase()}`,
      );
    }
    if (user) {
      await qc.invalidateQueries({ queryKey: ["maps", user.id] });
    }
    const trimmedSlug = map.slug.trim();
    if (trimmedSlug) {
      await qc.invalidateQueries({ queryKey: ["public_map", trimmedSlug] });
    }
    return { ok: true };
  }

  return { setVisibility, visibilityBusy };
}
