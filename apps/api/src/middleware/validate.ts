import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ZodError } from "zod";
import { ValidationError } from "../errors.js";

export type RequestSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

function fieldDetails(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}

function replaceObject(target: Record<string, unknown>, source: unknown): void {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, source);
}

// Schemas must be strict so unknown keys and operator-shaped values are rejected (DESIGN 7.6).
export function validate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body !== undefined) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query !== undefined) {
        replaceObject(req.query as Record<string, unknown>, schemas.query.parse(req.query));
      }
      if (schemas.params !== undefined) {
        replaceObject(req.params as Record<string, unknown>, schemas.params.parse(req.params));
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError(fieldDetails(error)));
        return;
      }
      next(error);
    }
  };
}
