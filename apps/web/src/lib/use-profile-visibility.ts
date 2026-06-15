import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useProfileVisibility(profile: Profile) {
  const qc = useQueryClient();
  const [publicBusy, setPublicBusy] = useState(false);
  const [crawlerBlockBusy, setCrawlerBlockBusy] = useState(false);

  async function invalidateProfileQueries() {
    await qc.invalidateQueries({ queryKey: ["profile", profile.id] });
    await qc.invalidateQueries({
      queryKey: ["public_profile", profile.slug],
    });
  }

  async function setPublic(isPublic: boolean): Promise<Profile | null> {
    if (isPublic === profile.is_public) return profile;
    setPublicBusy(true);
    const { error } = await supabase.rpc("set_profile_public", {
      p_is_public: isPublic,
    });
    setPublicBusy(false);
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success(
      isPublic ? "Profile is now public" : "Profile is now private",
    );
    const updated = { ...profile, is_public: isPublic };
    await invalidateProfileQueries();
    return updated;
  }

  async function setBlockCrawlers(block: boolean): Promise<Profile | null> {
    if (block === profile.block_public_crawlers) return profile;
    setCrawlerBlockBusy(true);
    const { error } = await supabase.rpc("set_profile_block_public_crawlers", {
      p_block: block,
    });
    setCrawlerBlockBusy(false);
    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success(
      block
        ? "Crawlers are blocked from your public profile"
        : "Crawler blocking turned off",
    );
    const updated = { ...profile, block_public_crawlers: block };
    await invalidateProfileQueries();
    return updated;
  }

  return {
    setPublic,
    setBlockCrawlers,
    publicBusy,
    crawlerBlockBusy,
  };
}
