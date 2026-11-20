import { ERROR_MESSAGES, type ErrorCode, type FieldError } from "@money-manager/shared";

// Domain error base class (DESIGN 9.2). Classes are allowed only for errors.
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: FieldError[] | undefined;

  constructor(status: number, code: ErrorCode, message?: string, details?: FieldError[]) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(details?: FieldError[], message?: string) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message?: string) {
    super(401, "UNAUTHENTICATED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message?: string) {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message?: string) {
    super(409, "CONFLICT", message);
  }
}

export class StaleRecordError extends AppError {
  constructor(message?: string) {
    super(409, "STALE_RECORD", message);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message?: string) {
    super(413, "PAYLOAD_TOO_LARGE", message);
  }
}

export class RuleViolationError extends AppError {
  constructor(message?: string) {
    super(422, "RULE_VIOLATION", message);
  }
}

export class RateLimitedError extends AppError {
  constructor(message?: string) {
    super(429, "RATE_LIMITED", message);
  }
}
