import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { join } from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import type pino from "pino";
import { pinoHttp } from "pino-http";
import type { Config } from "./config.js";
import { NotFoundError } from "./errors.js";
import { errorHandler } from "./middleware/error-handler.js";

const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=()";
const JSON_BODY_LIMIT = "100kb";

export type CreateAppOptions = {
  /** Mount extra API routes after `/api/health` and before the `/api` 404 (tests). */
  registerApiRoutes?: (app: express.Application) => void;
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
  exitFn: (code: number) => void = process.exit,
): void {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Server closed");
    exitFn(0);
  });
}

export function createApp(
  config: Config,
  logger: pino.Logger,
  webDistPath: string,
  options: CreateAppOptions = {},
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

  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

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
