import type { Response } from "express";
import type pino from "pino";
import { z } from "zod";

/**
 * Recursively unwrap wrapper schemas (ZodEffects / ZodOptional / ZodNullable /
 * ZodBranded / ZodDefault …) until a bare ZodObject is found (or return undefined).
 * Uses _def introspection rather than instanceof on internal classes, since Zod v4
 * does not expose all wrapper classes on the public `z` namespace.
 */
function unwrapToZodObject(schema: z.ZodType): z.ZodObject | undefined {
  if (schema instanceof z.ZodObject) return schema;
  const def = (schema as { _def?: unknown })._def;
  if (def === null || typeof def !== "object") return undefined;
  const d = def as Record<string, unknown>;
  // ZodEffects (.transform / .refine): _def.schema
  // ZodBranded (Zod v4): _def.type
  // ZodOptional / ZodNullable / ZodDefault: _def.innerType
  for (const key of ["schema", "type", "innerType"] as const) {
    if (d[key] instanceof z.ZodType) return unwrapToZodObject(d[key] as z.ZodType);
  }
  return undefined;
}

/**
 * Returns the top-level keys present in `data` that the unwrapped ZodObject
 * schema doesn't list. Works for schemas wrapped in .brand(), .transform(), etc.
 */
function detectExtraFields(schema: z.ZodType, data: unknown): string[] {
  const obj = unwrapToZodObject(schema);
  if (obj === undefined || typeof data !== "object" || data === null) return [];
  const known = new Set(Object.keys(obj.shape as Record<string, unknown>));
  return Object.keys(data as Record<string, unknown>).filter((k) => !known.has(k));
}

/**
 * Factory that returns a `respond` helper bound to `nodeEnv` and `logger`.
 *
 * Usage in route creators: `const respond = createRespond(config.NODE_ENV, logger);`
 *
 * - Dev / test: throws immediately if data has fields the schema doesn't list,
 *   so a data leak fails the test before it reaches the client (D-40, DESIGN 6.6).
 * - Production: forces strip mode so `.strict()` schemas don't throw on the extra
 *   fields; logs a warning only after a successful parse (so the log entry never
 *   fires when the parse itself fails for unrelated reasons).
 */
export function createRespond(nodeEnv: string, logger?: pino.Logger) {
  return function respond<T>(
    res: Response,
    schema: z.ZodType<T>,
    data: unknown,
    status = 200,
  ): void {
    const extra = detectExtraFields(schema, data);

    if (extra.length > 0 && nodeEnv !== "production") {
      throw new Error(
        `Data leak: respond() got fields not in schema: ${extra.join(", ")} (DESIGN 6.6, D-40)`,
      );
    }

    // Force strip mode so .strict() response schemas don't throw on extras.
    const parseWith: z.ZodType<T> =
      schema instanceof z.ZodObject ? (schema.strip() as z.ZodType<T>) : schema;
    const parsed = parseWith.parse(data);

    // Log AFTER a successful parse — no misleading entry when parse throws.
    if (extra.length > 0) {
      logger?.warn(
        { extra },
        "respond: stripped unlisted fields — possible data leak (DESIGN 6.6)",
      );
    }

    res.status(status).json({ success: true, data: parsed });
  };
}
