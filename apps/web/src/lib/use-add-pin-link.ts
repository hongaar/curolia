import { fetchLinkMetadata, normalizeUrlInput } from "@/lib/pin-links";
import { supabase } from "@/lib/supabase";
import { usePinLinks } from "@/lib/use-pin-links";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useAddPinLink(pinId: string | undefined, mapId: string) {
  const qc = useQueryClient();
  const linksQuery = usePinLinks(pinId);
  const links = linksQuery.data ?? [];

  return useMutation({
    mutationFn: async (rawUrl: string) => {
      if (!pinId) throw new Error("Save the pin before adding links.");
      const normalized = normalizeUrlInput(rawUrl);
      if (!normalized) throw new Error("Enter a valid http(s) URL.");
      let title: string | null = null;
      let faviconUrl: string | null = null;
      let urlToStore = normalized;
      try {
        const meta = await fetchLinkMetadata(normalized);
        title = meta.title;
        faviconUrl = meta.faviconUrl;
        urlToStore = meta.finalUrl || normalized;
      } catch (e) {
        console.warn("link metadata fetch failed", e);
      }
      const sortOrder = links.reduce(
        (m, l) => Math.max(m, l.sort_order + 1),
        0,
      );
      const { error } = await supabase.from("pin_links").insert({
        map_id: mapId,
        pin_id: pinId,
        url: urlToStore,
        title,
        favicon_url: faviconUrl,
        sort_order: sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pin-links", pinId] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Could not add link.");
    },
  });
}
