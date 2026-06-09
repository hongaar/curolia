import { canNavigateBack } from "@/lib/can-navigate-back";
import { PageBackButton as UiPageBackButton } from "@curolia/ui/page-back-button";
import { useLocation, useNavigate } from "react-router-dom";

export function PageBackButton() {
  const navigate = useNavigate();
  useLocation();

  if (!canNavigateBack()) return null;

  return <UiPageBackButton onClick={() => navigate(-1)} />;
}
