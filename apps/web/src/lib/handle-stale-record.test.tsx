// @vitest-environment jsdom
import { ERROR_MESSAGES } from "@money-manager/shared";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-client.js";
import { handleStaleRecord } from "./handle-stale-record.js";
import { queryKeys } from "./query-keys.js";

const toastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
  },
}));

describe("handleStaleRecord", () => {
  beforeEach(() => {
    toastError.mockReset();
  });

  it("[FR-9.10] shows the stale toast with Reload, which invalidates the query", async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    const key = queryKeys.me();

    const handled = handleStaleRecord(
      new ApiError("STALE_RECORD", ERROR_MESSAGES.STALE_RECORD),
      queryClient,
      key,
    );

    expect(handled).toBe(true);
    expect(toastError).toHaveBeenCalledWith(
      ERROR_MESSAGES.STALE_RECORD,
      expect.objectContaining({
        duration: Infinity,
        action: expect.objectContaining({ label: "Reload" }),
      }),
    );

    const action = toastError.mock.calls[0]?.[1] as {
      action: { onClick: () => void };
    };
    action.action.onClick();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: key });
  });

  it("[FR-9.10] ignores non-stale errors so callers can show a generic toast", () => {
    const queryClient = new QueryClient();
    const handled = handleStaleRecord(
      new ApiError("INTERNAL_ERROR", ERROR_MESSAGES.INTERNAL_ERROR),
      queryClient,
      queryKeys.me(),
    );
    expect(handled).toBe(false);
    expect(toastError).not.toHaveBeenCalled();
  });
});
