/** Injected clock for API tests (DESIGN 10.8). Domain code never reads the real clock. */
export type Clock = {
  now: () => Date;
};

export function fixedClock(iso: string): Clock {
  const fixed = new Date(iso);
  return {
    now: () => new Date(fixed.getTime()),
  };
}
