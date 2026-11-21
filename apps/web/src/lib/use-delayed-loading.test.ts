import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDelayedLoading } from "./use-delayed-loading.js";

describe("useDelayedLoading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("[FR-14.6] never shows a skeleton when loading finishes in under 300ms", () => {
    const { result, rerender } = renderHook(({ loading }) => useDelayedLoading(loading), {
      initialProps: { loading: true },
    });

    expect(result.current).toBe(false);

    // Advance only 299ms — just under the threshold
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe(false);

    // Load completes before the 300ms threshold fires
    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it("[FR-14.6] shows the skeleton after 300ms when still loading", () => {
    const { result } = renderHook(() => useDelayedLoading(true));

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);
  });

  it("[FR-14.6] hides the skeleton immediately when loading becomes false", () => {
    const { result, rerender } = renderHook(({ loading }) => useDelayedLoading(loading), {
      initialProps: { loading: true },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);

    rerender({ loading: false });
    expect(result.current).toBe(false);
  });
});
