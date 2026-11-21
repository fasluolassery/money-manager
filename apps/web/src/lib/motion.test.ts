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
  it("duration tokens match UI.md 6.2 values (in seconds, not ms)", () => {
    expect(duration.instant).toBe(0.1);
    expect(duration.fast).toBe(0.15);
    expect(duration.base).toBe(0.2);
    expect(duration.moderate).toBe(0.25);
    expect(duration.slow).toBe(0.5);
  });

  it("enter easing is cubic-bezier(0.2, 0, 0, 1) (UI.md 6.2)", () => {
    expect(easing.enter).toStrictEqual([0.2, 0, 0, 1]);
  });

  it("exit easing is cubic-bezier(0.4, 0, 1, 1) (UI.md 6.2)", () => {
    expect(easing.exit).toStrictEqual([0.4, 0, 1, 1]);
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
  it("hidden and exit use only opacity — no height or margin (UI.md 6.5)", () => {
    expect(listItem.hidden).toStrictEqual({ opacity: 0 });
    const exit = listItem.exit as { opacity: number; transition: object };
    expect(exit.opacity).toBe(0);
    expect(exit).not.toHaveProperty("height");
    expect(exit).not.toHaveProperty("marginBottom");
  });

  it("exit duration is 75% of base", () => {
    const exitDuration = (listItem.exit as { transition: { duration: number } }).transition
      .duration;
    expect(exitDuration).toBeCloseTo(duration.base * 0.75, 5);
  });
});
