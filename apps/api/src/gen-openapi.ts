/**
 * Generates docs/openapi.json from the route registry (DESIGN 6.8, D-40).
 * Run with: pnpm gen:openapi
 * CI regenerates it and fails if the committed file differs (DESIGN 10.2).
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Side-effect: registers /api/health in the route registry (via the registerRoute call in app.ts).
import "./app.js";
import { getRoutes, type RouteEntry } from "./route-registry.js";

// gen-openapi.ts lives at apps/api/src/ — four levels from repo root
const REPO_ROOT = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));
const OUT_PATH = join(REPO_ROOT, "docs", "openapi.json");

function schemaToJsonSchema(schema: z.ZodType): object {
  // Custom checks (dates, timezones) can't be derived; their `.meta()` describes them instead.
  return z.toJSONSchema(schema, { target: "openapi-3.1", unrepresentable: "any" });
}

function buildOperation(entry: RouteEntry): object {
  const operationId =
    entry.method.toLowerCase() +
    entry.path
      .replace(/^\/api/, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  const responses: Record<string, object> = {};

  if (entry.responseSchema !== undefined) {
    const dataSchema = schemaToJsonSchema(entry.responseSchema);
    // /api/health is outside the envelope; /api/v1 routes wrap data in {success,data}.
    const responseBody = entry.path.startsWith("/api/v1")
      ? {
          type: "object",
          required: ["success", "data"],
          properties: {
            success: { type: "boolean", enum: [true] },
            data: dataSchema,
          },
        }
      : dataSchema;

    responses["200"] = {
      description: "Success",
      content: { "application/json": { schema: responseBody } },
    };
  } else {
    responses["200"] = { description: "Success" };
  }

  if (entry.auth) {
    responses["401"] = { description: "No valid session" };
  }

  for (const [code, extra] of Object.entries(entry.additionalResponses ?? {})) {
    const addlExtra = extra as { description: string; schema?: z.ZodType };
    responses[code] =
      addlExtra.schema !== undefined
        ? {
            description: addlExtra.description,
            content: {
              "application/json": { schema: schemaToJsonSchema(addlExtra.schema) },
            },
          }
        : { description: addlExtra.description };
  }

  const op: Record<string, unknown> = {
    summary: entry.summary,
    operationId,
    responses,
  };

  if (!entry.auth) {
    op.security = [];
  }

  if (entry.requestSchema !== undefined) {
    op.requestBody = {
      required: true,
      content: {
        "application/json": { schema: schemaToJsonSchema(entry.requestSchema) },
      },
    };
  }

  return op;
}

function buildDocument(): object {
  const routes = getRoutes();
  const paths: Record<string, Record<string, object>> = {};

  for (const entry of routes) {
    const method = entry.method.toLowerCase();
    paths[entry.path] ??= {};
    // biome-ignore lint/style/noNonNullAssertion: initialised on the line above
    paths[entry.path]![method] = buildOperation(entry);
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Outgo API",
      version: "0.1.0",
      description:
        "Personal finance tracker API. All /api/v1 endpoints require a valid session cookie.",
    },
    paths,
  };
}

const document = buildDocument();
writeFileSync(OUT_PATH, `${JSON.stringify(document, null, 2)}\n`);
process.stdout.write(`Written: ${OUT_PATH}\n`);
