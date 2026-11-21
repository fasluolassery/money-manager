/**
 * Motion tokens and reusable animation helpers (UI.md 6.2–6.3, 6.5).
 * All durations and easings live here — components never hard-code them.
 */
import type { MotionProps, Variants } from "motion/react";

// ─── Duration tokens (ms → seconds for Motion) ───────────────────────────────
export const duration = {
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  moderate: 0.25,
  slow: 0.5,
} as const;

// ─── Easing tokens (UI.md 6.2) ───────────────────────────────────────────────
export const easing = {
  enter: [0.2, 0, 0, 1] as [number, number, number, number],
  exit: [0.4, 0, 1, 1] as [number, number, number, number],
} as const;

// ─── Spring token (selection pops, drag release) ─────────────────────────────
export const spring = { type: "spring", stiffness: 400, damping: 30 } as const;

// ─── Reusable animation helpers (UI.md 6.3) ──────────────────────────────────

/**
 * Press scale: 97% while held (buttons, cards, tiles).
 * With reduced motion the scale is omitted; only the transition is instant.
 */
export const pressScale: MotionProps = {
  whileTap: { scale: 0.97 },
  transition: { duration: duration.instant, ease: easing.enter },
};

/**
 * Tab cross-fade variants: fade out the leaving tab, fade in the entering one.
 */
export const tabCrossFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.fast, ease: easing.enter },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast * 0.75, ease: easing.exit },
  },
};

/**
 * Detail screen slide-in from the right with a fade (UI.md 6.3).
 * Back navigation should reverse the direction by negating the x offset.
 */
export const detailSlideIn: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.moderate, ease: easing.enter },
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: { duration: duration.moderate * 0.75, ease: easing.exit },
  },
};

/**
 * List item insert: fade in and expand into place.
 * List item remove: collapse out, letting neighbours slide up.
 */
export const listItem: Variants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    marginBottom: "auto",
    transition: { duration: duration.base, ease: easing.enter },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: duration.base * 0.75, ease: easing.exit },
  },
};
