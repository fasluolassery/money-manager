import type { Response } from "express";
import type pino from "pino";
import { z } from "zod";

/**
 * Returns the top-level keys present in `data` that the schema doesn't list.
 * Only checks ZodObject schemas at the top level — that covers all leaked fields
 * (userId, nameLower, idempotencyKey, _id) which are always top-level (DESIGN 6.6).
 */
function extraFields<T>(schema: z.ZodType<T>, data: unknown): string[] {
  if (!(schema instanceof z.ZodObject) || typeof data !== "object" || data === null) return [];
  const known = new Set(Object.keys((schema as z.ZodObject).shape as Record<string, unknown>));
  return Object.keys(data as Record<string, unknown>).filter((k) => !known.has(k));
}

/**
 * Factory that returns a `respond` helper bound to `nodeEnv` and `logger`.
 *
 * Usage in route creators: `const respond = createRespond(config.NODE_ENV, logger);`
 *
 * - Dev / test: throws immediately if data has fields the schema doesn't list,
 *   so a data leak fails the test before it reaches the client (D-40, DESIGN 6.6).
 * - Production: strips unknown fields (Zod default), logs a warning if any were found.
 */
export function createRespond(nodeEnv: string, logger?: pino.Logger) {
  return function respond<T>(
    res: Response,
    schema: z.ZodType<T>,
    data: unknown,
    status = 200,
  ): void {
    const extra = extraFields(schema, data);

    if (extra.length > 0) {
      if (nodeEnv !== "production") {
        throw new Error(
          `Data leak: respond() got fields not in schema: ${extra.join(", ")} (DESIGN 6.6, D-40)`,
        );
      }
      logger?.warn(
        { extra },
        "respond: stripped unlisted fields — possible data leak (DESIGN 6.6)",
      );
    }

    const parsed = schema.parse(data);
    res.status(status).json({ success: true, data: parsed });
  };
}
