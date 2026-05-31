import { Navigate } from "react-router-dom";

/** `/signup` — sign-up tab on the shared login page. */
export function SignupPage() {
  return <Navigate to="/login?tab=signup" replace />;
}
