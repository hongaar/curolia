import { PageBackButton as UiPageBackButton } from "@curolia/ui/page-back-button";
import { useNavigate } from "react-router-dom";

export function PageBackButton() {
  const navigate = useNavigate();
  return <UiPageBackButton onClick={() => navigate(-1)} />;
}
