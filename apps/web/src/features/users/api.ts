import { ERROR_MESSAGES, type MeResponse, type PatchMeBody } from "@money-manager/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiRequest, type FieldError } from "@/lib/api-client.js";
import { queryKeys } from "@/lib/query-keys.js";

/** The signed-in user's name, email and profile settings (DESIGN 6.5). */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiRequest<MeResponse>("/me"),
  });
}

/**
 * Saves the profile (welcome screen now, Settings later). A profile change refreshes
 * `me`, `home`, `reports`, `bills`, `lending` and `goals`: a new timezone changes what is
 * overdue (DESIGN 8.11). `me` takes the saved profile straight from the response.
 */
export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PatchMeBody) =>
      apiRequest<MeResponse>("/me", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: async (me) => {
      queryClient.setQueryData(queryKeys.me(), me);
      await Promise.all(
        [
          queryKeys.home(),
          queryKeys.reports.all(),
          queryKeys.bills.all(),
          queryKeys.lending.all(),
          queryKeys.goals.all(),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });
}

/** The per-field messages of a rejected save, ready to show under the inputs (DESIGN 9.5). */
export function saveErrorFields(error: unknown): FieldError[] {
  return error instanceof ApiError ? (error.details ?? []) : [];
}

/** The message to toast for a failed save: the server's own, or the catalogue's (DESIGN 9.6). */
export function saveErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
}
