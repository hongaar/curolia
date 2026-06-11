import {
  BLOCK_PUBLIC_CRAWLERS_ROBOTS,
  mapBlocksPublicCrawlers,
} from "@/lib/public-map-crawler-block";
import type { CuroliaMap } from "@/types/database";
import { useEffect } from "react";

const META_NAME = "robots";

function upsertRobotsMeta(content: string): () => void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${META_NAME}"]`);
  const created = !el;
  const previousContent = el?.getAttribute("content") ?? null;

  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", META_NAME);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);

  return () => {
    if (!el) return;
    if (created) {
      el.remove();
      return;
    }
    if (previousContent) {
      el.setAttribute("content", previousContent);
    } else {
      el.removeAttribute("content");
    }
  };
}

export function usePublicMapCrawlerBlockMeta(
  map: Pick<CuroliaMap, "is_public" | "block_public_crawlers"> | null,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !map || !mapBlocksPublicCrawlers(map)) return;
    return upsertRobotsMeta(BLOCK_PUBLIC_CRAWLERS_ROBOTS);
  }, [enabled, map?.is_public, map?.block_public_crawlers, map]);
}
