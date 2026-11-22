import { useRouteError } from "react-router";
import { ErrorState } from "@/components/ErrorState.js";

export function ErrorBoundaryPage() {
  useRouteError();
  return <ErrorState onRetry={() => window.location.reload()} />;
}
