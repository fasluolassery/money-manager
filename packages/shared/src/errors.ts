/**
 * Closed list of API error codes and their default messages (DESIGN 6.2, 9.6).
 * Copy follows UI.md 9.2–9.3: what happened and what to do, no technical jargon.
 */

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "STALE_RECORD",
  "PAYLOAD_TOO_LARGE",
  "RULE_VIOLATION",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
  "NETWORK_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Check the highlighted fields.",
  UNAUTHENTICATED: "Sign in to continue.",
  FORBIDDEN: "You can't do that.",
  NOT_FOUND: "Couldn't find that.",
  CONFLICT: "That already exists. Try a different name.",
  STALE_RECORD: "This was changed on another device. Reload to see the latest version.",
  PAYLOAD_TOO_LARGE: "That request is too large. Try something smaller.",
  RULE_VIOLATION: "That breaks a rule. Check and try again.",
  RATE_LIMITED: "Too many requests. Wait a moment and try again.",
  INTERNAL_ERROR: "Something went wrong. Try again in a moment.",
  // Frontend only (DESIGN 6.2); kept in the catalogue so the web client shares one list.
  NETWORK_ERROR: "Couldn't save. Check your connection and try again.",
};

export type FieldError = {
  field: string;
  message: string;
};

export function isErrorCode(value: string): value is ErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}
