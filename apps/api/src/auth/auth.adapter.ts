import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import type pino from "pino";
import { UnauthenticatedError } from "../errors.js";
import type { Auth } from "./auth.js";

export type AuthAdapter = ReturnType<typeof createAuthAdapter>;

export function createAuthAdapter({ auth, logger }: { auth: Auth; logger: pino.Logger }) {
  return {
    /**
     * Resolves the userId from the signed session cookie.
     * Returns null when there is no session. Throws UnauthenticatedError when
     * Better Auth fails internally so callers never surface library errors (DESIGN 9.6).
     */
    async getUserId(req: Request): Promise<string | null> {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });
        return session?.user.id ?? null;
      } catch (err) {
        logger.error({ err }, "auth.api.getSession failed");
        throw new UnauthenticatedError();
      }
    },
  };
}
