import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { join } from "node:path";
import type { AwilixContainer } from "awilix";
import express, { type NextFunction, type Request, type Response, Router } from "express";
import helmet from "helmet";
import type pino from "pino";
import { pinoHttp } from "pino-http";
import { z } from "zod";
import type { Config } from "./config.js";
import type { AppCradle } from "./container.js";
import { NotFoundError } from "./errors.js";
import { clientIpHeader } from "./middleware/client-ip.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createOriginCheck } from "./middleware/origin-check.js";
import { API_RATE_LIMIT_WINDOW_MS, createRateLimit } from "./middleware/rate-limit.js";
import { createLoadSession, createRequireAuth } from "./middleware/require-auth.js";
import { createUsersRoutes } from "./modules/users/users.routes.js";
import { registerRoute } from "./route-registry.js";

/** Schema for the `/api/health` 200 response (outside the success envelope). */
export const healthResponseSchema = z.object({ status: z.literal("ok") });

registerRoute({
  method: "GET",
  path: "/api/health",
  summary: "Health check — 200 when the server can reach the database (DESIGN 11.2)",
  auth: false,
  responseSchema: healthResponseSchema,
  additionalResponses: {
    503: {
      description: "Database unreachable",
      schema: z.object({ status: z.literal("unavailable") }),
    },
  },
});

const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=()";
const JSON_BODY_LIMIT = "100kb";

export type CreateAppOptions = {
  /** Ping the database for `/api/health` (DESIGN 11.2). */
  pingDb: () => Promise<void>;
  /** Feature modules resolve services from this container (DESIGN 4.4). */
  container?: AwilixContainer<AppCradle>;
  /** Mount extra API routes after `/api/health` and before the `/api` 404 (tests). */
  registerApiRoutes?: (app: express.Application) => void;
};

export type GracefulShutdownOptions = {
  onClose?: () => void | Promise<void>;
  exitFn?: (code: number) => void;
};

function helmetOptions(nodeEnv: string): Parameters<typeof helmet>[0] {
  return {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: nodeEnv === "production" ? { maxAge: 31536000, includeSubDomains: true } : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" as const },
  };
}

function staticMiddleware(webDistPath: string) {
  const indexHtml = join(webDistPath, "index.html");

  const serveFiles = express.static(webDistPath, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.includes("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.endsWith("sw.js") || filePath.endsWith("service-worker.js")) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    },
  });

  function spaFallback(req: Request, res: Response, next: NextFunction) {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(indexHtml, (err) => {
      if (err) next(err);
    });
  }

  return [serveFiles, spaFallback] as const;
}

export function gracefulShutdown(
  server: Server,
  logger: pino.Logger,
  options: GracefulShutdownOptions = {},
): void {
  const exitFn = options.exitFn ?? process.exit;
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    void (async () => {
      try {
        await options.onClose?.();
      } catch (error) {
        logger.error({ error }, "Error during shutdown");
      }
      logger.info("Server closed");
      exitFn(0);
    })();
  });
}

/**
 * Better Auth's endpoints. Mounted before `express.json()`, which would consume the
 * body Better Auth reads itself (Q-06). Its own limiter counts per client IP.
 */
function mountAuth(app: express.Application, container: AwilixContainer<AppCradle>): void {
  app.use("/api/auth", clientIpHeader);
  app.all("/api/auth/*splat", container.cradle.authAdapter.handler);
}

/**
 * `/api/v1`: Origin check, then the session (so the limiter can count per user),
 * then the rate limit, then `requireAuth`, so signed-out requests are limited
 * per IP before they are refused (DESIGN 7.4). `requireAuth` also makes sure the
 * signed-in user has a profile (DESIGN 7.2).
 */
function createApiV1Router(config: Config, container: AwilixContainer<AppCradle>): Router {
  const router = Router();
  router.use(createOriginCheck(config.APP_URL));
  router.use(createLoadSession(container.cradle.authAdapter));
  router.use(createRateLimit({ windowMs: API_RATE_LIMIT_WINDOW_MS, limit: config.RATE_LIMIT_API }));
  router.use(createRequireAuth(container.cradle.usersService));
  router.use(createUsersRoutes(container));
  return router;
}

export function createApp(
  config: Config,
  logger: pino.Logger,
  webDistPath: string,
  options: CreateAppOptions,
): express.Application {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet(helmetOptions(config.NODE_ENV)));

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Permissions-Policy", PERMISSIONS_POLICY);
    next();
  });

  app.use(
    pinoHttp({
      logger,
      genReqId: () => randomUUID(),
      customLogLevel: (_req, res, err) => {
        if (err !== undefined || res.statusCode >= 500) return "error";
        const { statusCode } = res;
        if (statusCode === 401 || statusCode === 403 || statusCode === 429) return "warn";
        return "info";
      },
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Request-Id", String(_req.id));
    next();
  });

  app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  if (options.container !== undefined) mountAuth(app, options.container);

  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      await options.pingDb();
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });

  if (options.container !== undefined) {
    app.use("/api/v1", createApiV1Router(config, options.container));
  }

  options.registerApiRoutes?.(app);

  app.use("/api", (_req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError());
  });

  const [serveFiles, spaFallback] = staticMiddleware(webDistPath);
  app.use(serveFiles);
  app.use(spaFallback);

  app.use(errorHandler);

  return app;
}
