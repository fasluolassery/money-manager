import type { Clock } from "../clock.js";

export type { Clock };

/** Injected clock for API tests (DESIGN 10.8). Domain code never reads the real clock. */
export function fixedClock(iso: string): Clock {
  const fixed = new Date(iso);
  return {
    now: () => new Date(fixed.getTime()),
  };
}
