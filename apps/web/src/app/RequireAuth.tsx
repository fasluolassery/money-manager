import { Navigate, Outlet, useLocation } from "react-router";
import { ErrorState } from "@/components/ErrorState.js";
import { useMe } from "@/features/users/api.js";
import { ApiError } from "@/lib/api-client.js";
import { useAuthSession } from "@/lib/auth-session.js";

const WELCOME_PATH = "/welcome";

function Busy() {
  return <div className="text-body text-text-muted p-4" aria-busy="true" />;
}

/**
 * Signed in but not finished with the welcome screen (`onboardedAt` null) → `/welcome`;
 * finished → never back to it (DESIGN 8.3, 7.2, FR-13.4).
 */
function OnboardingGate() {
  const { pathname } = useLocation();
  const { data: me, isPending, error, refetch } = useMe();

  if (isPending) return <Busy />;
  if (me === undefined) {
    return (
      <ErrorState
        requestId={error instanceof ApiError ? error.requestId : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  const onWelcome = pathname === WELCOME_PATH;
  if (me.onboardedAt === null && !onWelcome) return <Navigate to={WELCOME_PATH} replace />;
  if (me.onboardedAt !== null && onWelcome) return <Navigate to="/" replace />;
  return <Outlet />;
}

/**
 * Route guards (DESIGN 8.3): signed-out users go to `/sign-in` with `from` set to the page
 * they wanted; signed-in users who haven't finished the welcome screen go to `/welcome`.
 */
export function RequireAuth() {
  const location = useLocation();
  const { data: session, isPending, isError } = useAuthSession();

  if (isPending) return <Busy />;

  if (isError || session === null || session === undefined) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/sign-in?from=${encodeURIComponent(from)}`} replace />;
  }

  return <OnboardingGate />;
}
