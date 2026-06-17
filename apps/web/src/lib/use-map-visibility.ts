import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useMapVisibility(map: { id: string; slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [publicBusy, setPublicBusy] = useState(false);

  async function setPublic(
    isPublic: boolean,
    currentIsPublic: boolean,
    options?: { silent?: boolean },
  ): Promise<boolean> {
    if (isPublic === currentIsPublic) return true;
    setPublicBusy(true);
    const { error } = await supabase.rpc("set_map_public", {
      p_map_id: map.id,
      p_is_public: isPublic,
    });
    setPublicBusy(false);
    if (error) {
      if (!options?.silent) toast.error(error.message);
      return false;
    }
    if (!options?.silent) {
      toast.success(isPublic ? "Map is now public" : "Map is now private");
    }
    if (user) {
      await qc.invalidateQueries({ queryKey: ["maps", user.id] });
    }
    const trimmedSlug = map.slug.trim();
    if (trimmedSlug) {
      await qc.invalidateQueries({ queryKey: ["public_map", trimmedSlug] });
    }
    return true;
  }

  return { setPublic, publicBusy };
}
