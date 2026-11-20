import { ERROR_MESSAGES, type FieldError } from "@money-manager/shared";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, PayloadTooLargeError, ValidationError } from "../errors.js";

type BodyParserError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
};

function requestIdOf(req: Request): string {
  return String(req.id ?? "");
}

function sendError(
  res: Response,
  status: number,
  code: keyof typeof ERROR_MESSAGES,
  message: string,
  requestId: string,
  details?: FieldError[],
): void {
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && details.length > 0 ? { details } : {}),
      requestId,
    },
  });
}

function detailsFromZod(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}

function isInvalidJson(error: BodyParserError): boolean {
  return (
    error.type === "entity.parse.failed" || (error instanceof SyntaxError && error.status === 400)
  );
}

function isBodyTooLarge(error: BodyParserError): boolean {
  return error.type === "entity.too.large" || error.status === 413 || error.statusCode === 413;
}

function logUnhandled(req: Request, error: unknown): void {
  req.log?.error({ err: error }, "Unhandled error");
}

/**
 * Last middleware: every failure becomes the DESIGN 6.2 envelope (DESIGN 9.3, 9.6).
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = requestIdOf(req);

  if (error instanceof AppError) {
    sendError(res, error.status, error.code, error.message, requestId, error.details);
    return;
  }

  if (error instanceof ZodError) {
    const mapped = new ValidationError(detailsFromZod(error));
    sendError(res, mapped.status, mapped.code, mapped.message, requestId, mapped.details);
    return;
  }

  if (error instanceof Error) {
    const bodyError = error as BodyParserError;
    if (isInvalidJson(bodyError)) {
      const mapped = new ValidationError();
      sendError(res, mapped.status, mapped.code, mapped.message, requestId);
      return;
    }
    if (isBodyTooLarge(bodyError)) {
      const mapped = new PayloadTooLargeError();
      sendError(res, mapped.status, mapped.code, mapped.message, requestId);
      return;
    }
  }

  logUnhandled(req, error);
  sendError(res, 500, "INTERNAL_ERROR", ERROR_MESSAGES.INTERNAL_ERROR, requestId);
}
