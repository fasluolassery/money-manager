import { useEffect, useState } from "react";

const SKELETON_DELAY_MS = 300;

/**
 * Returns true only after `isLoading` has been true for more than 300ms.
 * Prevents skeleton flash on fast loads (UI.md 5.1).
 */
export function useDelayedLoading(isLoading: boolean): boolean {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }
    const id = setTimeout(() => setShowSkeleton(true), SKELETON_DELAY_MS);
    return () => clearTimeout(id);
  }, [isLoading]);

  return showSkeleton;
}
