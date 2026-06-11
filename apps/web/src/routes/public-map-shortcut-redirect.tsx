import { Navigate, useLocation } from "react-router-dom";

/** `/:profileSlug/:mapSlug` → `/:profileSlug/:mapSlug/map` (preserves query). */
export function PublicMapShortcutRedirect() {
  const { search } = useLocation();
  return <Navigate to={`map${search}`} replace />;
}
