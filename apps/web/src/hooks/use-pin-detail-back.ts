import { useFrozenBaseLocation } from "@/hooks/use-frozen-base-location";
import {
  pinDetailBackFallback,
  pinDetailBackTarget,
  type PinDetailBackTarget,
} from "@/lib/pin-detail-back";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function usePinDetailBack({
  profileSlug,
  mapSlug,
  fallbackMapHref,
}: {
  profileSlug: string | undefined;
  mapSlug: string | undefined;
  fallbackMapHref: string | null;
}): PinDetailBackTarget & { onBack: () => void } {
  const navigate = useNavigate();
  const frozenBase = useFrozenBaseLocation();

  const target = useMemo((): PinDetailBackTarget => {
    const fromFrozen = pinDetailBackTarget(frozenBase);
    if (fromFrozen) return fromFrozen;
    if (fallbackMapHref) {
      return {
        href: fallbackMapHref,
        label: "Back to map",
        view: "map",
      };
    }
    if (profileSlug?.trim() && mapSlug?.trim()) {
      return pinDetailBackFallback(profileSlug.trim(), mapSlug.trim());
    }
    return { href: "/", label: "Back to map", view: "map" };
  }, [fallbackMapHref, frozenBase, mapSlug, profileSlug]);

  const onBack = useCallback(() => {
    navigate(target.href);
  }, [navigate, target.href]);

  return { ...target, onBack };
}
