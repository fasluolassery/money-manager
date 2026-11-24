import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthSession } from "@/lib/auth-session.js";

/**
 * Signed-out users go to `/sign-in` with `from` set to the page they wanted (DESIGN 8.3).
 * Welcome / onboardedAt gating belongs to #18.
 */
export function RequireAuth() {
  const location = useLocation();
  const { data: session, isPending, isError } = useAuthSession();

  if (isPending) {
    return <div className="text-body text-text-muted p-4" aria-busy="true" />;
  }

  if (isError || session === null || session === undefined) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/sign-in?from=${encodeURIComponent(from)}`} replace />;
  }

  return <Outlet />;
}
