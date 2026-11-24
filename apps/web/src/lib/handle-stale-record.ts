import { ERROR_MESSAGES } from "@money-manager/shared";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { isStaleRecordError } from "./api-client.js";

/**
 * Shows the stale-edit toast with Reload (UI.md 3.15, DESIGN 4.7).
 * Returns true when the error was handled so callers can skip a generic toast.
 * Reload invalidates `queryKey`; open form values are left alone until then.
 */
export function handleStaleRecord(
  error: unknown,
  queryClient: QueryClient,
  queryKey: QueryKey,
): boolean {
  if (!isStaleRecordError(error)) return false;

  toast.error(ERROR_MESSAGES.STALE_RECORD, {
    duration: Infinity,
    action: {
      label: "Reload",
      onClick: () => {
        void queryClient.invalidateQueries({ queryKey });
      },
    },
  });
  return true;
}
