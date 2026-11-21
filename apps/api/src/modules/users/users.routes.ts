import type { AwilixContainer } from "awilix";
import { Router } from "express";
import type { UsersService } from "./users.service.js";

/**
 * Users HTTP routes (DESIGN 4.1). No endpoints yet — those land in #18.
 * Resolves the service from the container so the wiring is exercised.
 */
export function createUsersRoutes(container: AwilixContainer): Router {
  const router = Router();
  // Keep the resolve so a missing registration fails at boot/test time.
  container.resolve<UsersService>("usersService");
  return router;
}
