import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button.js";

const ErrorIllustration = lazy(() => import("@/assets/illustrations/ErrorIllustration.js"));

interface ErrorStateProps {
  /** Request ID shown so support can trace the error (DESIGN 9.5, UI.md 5.1). */
  requestId?: string;
  onRetry?: () => void;
}

/** Error state with illustration, message, optional Retry and request ID (UI.md 5.1). */
export function ErrorState({ requestId, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <Suspense fallback={<div className="h-32 w-32" aria-hidden />}>
        <ErrorIllustration className="h-32 w-32 text-primary" aria-hidden="true" role="img" />
      </Suspense>
      <div className="max-w-xs">
        <p className="text-body text-text">Something went wrong. Try again in a moment.</p>
        {requestId && <p className="text-caption text-text-muted mt-1">Request ID: {requestId}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
