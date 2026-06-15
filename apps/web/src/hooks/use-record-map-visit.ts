import { recordMapVisit } from "@/lib/home-feed";
import { useAuth } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/** Persist a map open for the signed-in home feed. */
export function useRecordMapVisit(mapId: string | null | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lastRecordedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !mapId || lastRecordedRef.current === mapId) return;
    lastRecordedRef.current = mapId;

    void recordMapVisit(mapId)
      .then(() => {
        void qc.invalidateQueries({ queryKey: ["home_feed", user.id] });
      })
      .catch((error: unknown) => {
        console.error("Failed to record map visit", error);
        lastRecordedRef.current = null;
      });
  }, [mapId, qc, user]);
}
