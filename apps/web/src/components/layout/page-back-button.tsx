import { useFrozenBaseLocation } from "@/hooks/use-frozen-base-location";
import {
  canNavigateBack,
  shouldShowPageBackButton,
} from "@/lib/can-navigate-back";
import { locationHref, pinDetailBackTarget } from "@/lib/pin-detail-back";
import { PageBackButton as UiPageBackButton } from "@curolia/ui/page-back-button";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function PageBackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const frozenBase = useFrozenBaseLocation();

  const handleBack = useCallback(() => {
    if (canNavigateBack()) {
      navigate(-1);
      return;
    }
    const target = pinDetailBackTarget(frozenBase);
    navigate(target?.href ?? locationHref(frozenBase));
  }, [frozenBase, navigate]);

  if (!shouldShowPageBackButton(pathname)) return null;

  return <UiPageBackButton onClick={handleBack} />;
}
