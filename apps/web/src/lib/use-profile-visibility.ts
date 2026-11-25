import { supabase } from "@/lib/supabase";
import {
  PROFILE_VISIBILITY_LABELS,
  type ProfileVisibility,
} from "@/lib/visibility";
import type { Profile } from "@/types/database";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useProfileVisibility(profile: Profile) {
  const qc = useQueryClient();
  const [visibilityBusy, setVisibilityBusy] = useState(false);

  async function setVisibility(
    visibility: ProfileVisibility,
  ): Promise<Profile | null> {
    if (visibility === profile.visibility) return profile;
    setVisibilityBusy(true);
    const { error } = await supabase.rpc("set_profile_visibility", {
      p_visibility: visibility,
    });
    setVisibilityBusy(false);
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success(
      `Profile is now ${PROFILE_VISIBILITY_LABELS[visibility].toLowerCase()}`,
    );
    await qc.invalidateQueries({ queryKey: ["profile", profile.id] });
    await qc.invalidateQueries({
      queryKey: ["public_profile", profile.slug],
    });
    return { ...profile, visibility };
  }

  return { setVisibility, visibilityBusy };
}
