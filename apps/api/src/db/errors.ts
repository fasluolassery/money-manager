import { MongoServerError } from "mongodb";
import { ConflictError } from "../errors.js";

const DUPLICATE_KEY_CODE = 11000;

export function isDuplicateKeyError(error: unknown): error is MongoServerError {
  return error instanceof MongoServerError && error.code === DUPLICATE_KEY_CODE;
}

/** Best-effort index name from a duplicate-key error. */
export function duplicateKeyIndexName(error: MongoServerError): string | undefined {
  const fromMessage = /index:\s*([^\s]+)/.exec(error.message)?.[1];
  if (fromMessage !== undefined) return fromMessage;
  if (error.keyPattern !== undefined) {
    return Object.keys(error.keyPattern).join("_");
  }
  return undefined;
}

/**
 * Translate a driver error at the repository boundary (DESIGN 9.6).
 * Duplicate key → ConflictError with a message for that index; anything else rethrown.
 * Idempotency-key lookups stay in the repository: on duplicate, call
 * `isDuplicateKeyError` then load the existing row instead of using this helper.
 */
export function translateDriverError(
  error: unknown,
  indexMessages: Record<string, string> = {},
): never {
  if (isDuplicateKeyError(error)) {
    const indexName = duplicateKeyIndexName(error);
    const message =
      indexName !== undefined && indexMessages[indexName] !== undefined
        ? indexMessages[indexName]
        : undefined;
    throw new ConflictError(message);
  }
  throw error;
}
