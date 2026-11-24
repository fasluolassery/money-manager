/**
 * Safe in-app path for post-sign-in redirect. Rejects protocol-relative and
 * absolute URLs so a crafted `?from=` can't send the user off-site.
 */
export function safeReturnTo(value: string | null | undefined, fallback = "/"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
