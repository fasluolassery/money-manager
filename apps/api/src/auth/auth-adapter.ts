import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import { type UserId, userIdSchema } from "@money-manager/shared";
import { APIError } from "better-auth/api";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import type { Auth } from "./auth.js";

/** The slice of Better Auth the adapter uses, so tests can pass a test-only instance. */
export type AuthCore = Pick<Auth, "handler"> & {
  api: Pick<Auth["api"], "getSession">;
};

export type SessionLookup = {
  /** The signed-in user, or null when there is no valid session. */
  userId: UserId | null;
  /** Their name and email, the only Better Auth data the app returns (`GET /me`, DESIGN 6.6). */
  identity: { name: string; email: string } | null;
  /** `Set-Cookie` values to forward: a refreshed or cleared session cookie. */
  setCookies: string[];
};

export type AuthAdapter = {
  /** Serves Better Auth's own endpoints under `/api/auth/*`. */
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
  getSession: (headers: IncomingHttpHeaders) => Promise<SessionLookup>;
};

/**
 * App code reaches Better Auth only through this adapter (D-30, DESIGN 9.6).
 * "No session" is a normal answer; any other Better Auth failure is rethrown and
 * becomes a logged 500 with the catalogue message, never Better Auth's text.
 */
export function createAuthAdapter({ auth }: { auth: AuthCore }): AuthAdapter {
  return {
    handler: toNodeHandler(auth),
    async getSession(headers) {
      try {
        const { headers: responseHeaders, response } = await auth.api.getSession({
          headers: fromNodeHeaders(headers),
          returnHeaders: true,
        });
        return {
          userId: response === null ? null : userIdSchema.parse(response.user.id),
          identity:
            response === null ? null : { name: response.user.name, email: response.user.email },
          setCookies: responseHeaders.getSetCookie(),
        };
      } catch (error) {
        if (error instanceof APIError && error.status === "UNAUTHORIZED") {
          return { userId: null, identity: null, setCookies: [] };
        }
        throw error;
      }
    },
  };
}
