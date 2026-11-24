import { createAuthClient } from "better-auth/client";

/**
 * Better Auth browser client for Google OAuth only (DESIGN 7.1, 9.6).
 * Loaded from the sign-in page so it stays out of the initial JS budget (DESIGN 12).
 * Same origin: Vite proxy and production single host; cookies stay first-party.
 */
export const authClient = createAuthClient();

/** Catalogue copy for `/api/auth/*` failures (DESIGN 9.6, UI.md 9.3). */
export const SIGN_IN_FAILED_MESSAGE = "Couldn't sign you in. Try again.";
