import { useNavigate } from "react-router-dom";
import { PageBackButton as UiPageBackButton } from "@curolia/ui/page-back-button";

export function PageBackButton() {
  const navigate = useNavigate();
  return <UiPageBackButton onClick={() => navigate(-1)} />;
}
