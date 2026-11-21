import type { z } from "zod";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type AdditionalResponse = {
  description: string;
  schema?: z.ZodType;
};

export type RouteEntry = {
  method: HttpMethod;
  path: string;
  summary: string;
  /** Whether the endpoint requires a valid session (DESIGN 6.1). */
  auth: boolean;
  /** Request body schema for POST / PATCH endpoints. */
  requestSchema?: z.ZodType;
  /** Success-response data schema. For /api/v1 routes this is the `data` field inside the envelope. */
  responseSchema?: z.ZodType;
  /** Extra response codes beyond 200/401 (e.g. 503 for health). */
  additionalResponses?: Record<number, AdditionalResponse>;
};

const _routes: RouteEntry[] = [];

export function registerRoute(entry: RouteEntry): void {
  _routes.push(entry);
}

export function getRoutes(): readonly RouteEntry[] {
  return _routes;
}
