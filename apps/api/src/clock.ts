/** The time source services receive, so tests can inject a fixed one (DESIGN 10.8). */
export type Clock = {
  now: () => Date;
};

export const systemClock: Clock = {
  now: () => new Date(),
};
