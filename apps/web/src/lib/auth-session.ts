import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys.js";

export type AuthSession = {
  user: { id: string; name: string; email: string; image?: string | null };
  session: { id: string; expiresAt: Date | string };
};

/**
 * Session via Better Auth's HTTP endpoint (no client SDK in the initial bundle).
 * `null` means signed out (DESIGN 8.3, 8.11).
 */
export async function fetchAuthSession(): Promise<AuthSession | null> {
  const response = await fetch("/api/auth/get-session", { credentials: "include" });
  if (!response.ok) return null;
  const data: unknown = await response.json();
  if (data === null || typeof data !== "object" || !("user" in data)) return null;
  return data as AuthSession;
}

export function useAuthSession() {
  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchAuthSession,
    staleTime: 60_000,
    retry: false,
  });
}

/** Drop cached session after sign-in/out so guards see the new state. */
export function useInvalidateAuthSession() {
  const queryClient = useQueryClient();
  return () => queryClient.removeQueries({ queryKey: queryKeys.session() });
}

/** Current session only (DESIGN 7.3). */
export async function signOutCurrentSession(): Promise<void> {
  const response = await fetch("/api/auth/sign-out", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!response.ok) {
    throw new Error("sign-out failed");
  }
}
