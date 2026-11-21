import { describe, expect, it } from "vitest";
import {
  detailSlideIn,
  duration,
  easing,
  listItem,
  pressScale,
  spring,
  tabCrossFade,
} from "./motion.js";

describe("motion tokens", () => {
  it("durations are in ascending order and in seconds", () => {
    expect(duration.instant).toBeLessThan(duration.fast);
    expect(duration.fast).toBeLessThan(duration.base);
    expect(duration.base).toBeLessThan(duration.moderate);
    expect(duration.moderate).toBeLessThan(duration.slow);
    // All < 1 s (seconds, not ms)
    for (const v of Object.values(duration)) {
      expect(v).toBeLessThan(1);
    }
  });

  it("exit easing starts faster than enter easing (cubic control points)", () => {
    // enter: cubic-bezier(0.2, 0, 0, 1) — gentle start
    // exit:  cubic-bezier(0.4, 0, 1, 1) — faster start (higher first x control)
    expect(easing.exit[0]).toBeGreaterThan(easing.enter[0]);
  });

  it("spring is a spring type with the specified stiffness and damping", () => {
    expect(spring.type).toBe("spring");
    expect(spring.stiffness).toBe(400);
    expect(spring.damping).toBe(30);
  });
});

describe("pressScale helper", () => {
  it("scales to 0.97 on tap", () => {
    expect((pressScale.whileTap as { scale: number }).scale).toBe(0.97);
  });

  it("uses the instant duration", () => {
    expect((pressScale.transition as { duration: number }).duration).toBe(duration.instant);
  });
});

describe("tabCrossFade variants", () => {
  it("hidden state has opacity 0", () => {
    expect(tabCrossFade.hidden).toMatchObject({ opacity: 0 });
  });

  it("exit duration is 75% of fast", () => {
    const exitDuration = (tabCrossFade.exit as { transition: { duration: number } }).transition
      .duration;
    expect(exitDuration).toBeCloseTo(duration.fast * 0.75, 5);
  });
});

describe("detailSlideIn variants", () => {
  it("hidden state has x offset of 16px and opacity 0", () => {
    expect(detailSlideIn.hidden).toMatchObject({ opacity: 0, x: 16 });
  });

  it("visible state resets x to 0", () => {
    expect((detailSlideIn.visible as { x: number }).x).toBe(0);
  });

  it("exit duration is 75% of moderate", () => {
    const exitDuration = (detailSlideIn.exit as { transition: { duration: number } }).transition
      .duration;
    expect(exitDuration).toBeCloseTo(duration.moderate * 0.75, 5);
  });
});

describe("listItem variants", () => {
  it("hidden state collapses height to 0", () => {
    expect(listItem.hidden).toMatchObject({ opacity: 0, height: 0 });
  });

  it("visible state expands to auto height", () => {
    expect((listItem.visible as { height: string }).height).toBe("auto");
  });
});
