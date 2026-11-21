import { ERROR_MESSAGES } from "@money-manager/shared";

const BASE_URL = "/api/v1";
const TIMEOUT_MS = 15_000;

export type FieldError = { field: string; message: string };

/** Error thrown for every non-success API response (DESIGN 8.4, 9.6). Classes are allowed for errors. */
export class ApiError extends Error {
  readonly code: string;
  readonly requestId: string | undefined;
  readonly details: FieldError[] | undefined;

  constructor(code: string, message: string, requestId?: string, details?: FieldError[]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

type Envelope<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { code: string; message: string; requestId?: string; details?: FieldError[] };
    };

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return typeof value === "object" && value !== null && "success" in value;
}

/**
 * Fetches from `/api/v1`, unwraps `{ success, data }`, throws `ApiError` on failure (DESIGN 8.4).
 * Redirects to `/sign-in` on 401. Times out after 15 s with NETWORK_ERROR (DESIGN 15.6).
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    clearTimeout(timer);
    throw new ApiError("NETWORK_ERROR", ERROR_MESSAGES.NETWORK_ERROR);
  }
  clearTimeout(timer);

  if (response.status === 401) {
    window.location.href = "/sign-in";
    throw new ApiError("UNAUTHENTICATED", ERROR_MESSAGES.UNAUTHENTICATED);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError("INTERNAL_ERROR", ERROR_MESSAGES.INTERNAL_ERROR);
  }

  if (!isEnvelope(body)) {
    throw new ApiError("INTERNAL_ERROR", ERROR_MESSAGES.INTERNAL_ERROR);
  }

  if (body.success === true) {
    return body.data as T;
  }

  const { error } = body;
  throw new ApiError(error.code, error.message, error.requestId, error.details);
}
