import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button.js";

// Lazy-loaded so illustrations don't inflate the main bundle (UI.md 4.6)
const EmptyIllustration = lazy(() => import("@/assets/illustrations/EmptyIllustration.js"));

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Empty data state with an illustration, a message and an optional action (UI.md 5.1, 4.6). */
export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <Suspense fallback={<div className="h-32 w-32" aria-hidden />}>
        <EmptyIllustration className="h-32 w-32 text-primary" aria-hidden="true" role="img" />
      </Suspense>
      <p className="text-body text-text-muted max-w-xs">{message}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
