import { meResponseSchema, patchMeBodySchema } from "@money-manager/shared";
import type { AwilixContainer } from "awilix";
import { Router } from "express";
import type { AppCradle } from "../../container.js";
import { getSessionUser } from "../../middleware/require-auth.js";
import { validate } from "../../middleware/validate.js";
import { createRespond } from "../../respond.js";
import { registerRoute } from "../../route-registry.js";

registerRoute({
  method: "GET",
  path: "/api/v1/me",
  summary: "The signed-in user's name, email and profile settings",
  auth: true,
  responseSchema: meResponseSchema,
});

registerRoute({
  method: "PATCH",
  path: "/api/v1/me",
  summary:
    "Save the timezone and, optionally, the opening balance and its date; the first save finishes onboarding",
  auth: true,
  requestSchema: patchMeBodySchema,
  responseSchema: meResponseSchema,
  additionalResponses: {
    400: { description: "Invalid timezone, amount or date (VALIDATION_ERROR)" },
    409: { description: "The profile changed on another device (STALE_RECORD)" },
  },
});

/** Users HTTP routes under `/api/v1` (DESIGN 4.1, 6.5). */
export function createUsersRoutes(container: AwilixContainer<AppCradle>): Router {
  const router = Router();
  const { usersService, config, logger } = container.cradle;
  const respond = createRespond(config.NODE_ENV, logger);

  router.get("/me", async (req, res) => {
    const { userId, identity } = getSessionUser(req);
    respond(res, meResponseSchema, await usersService.getMe(userId, identity));
  });

  router.patch("/me", validate({ body: patchMeBodySchema }), async (req, res) => {
    const { userId, identity } = getSessionUser(req);
    respond(res, meResponseSchema, await usersService.patchMe(userId, identity, req.body));
  });

  return router;
}
