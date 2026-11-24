import { type AwilixContainer, asFunction, asValue, createContainer, InjectionMode } from "awilix";
import type pino from "pino";
import { type Auth, createAuth } from "./auth/auth.js";
import { type AuthAdapter, createAuthAdapter } from "./auth/auth-adapter.js";
import { type Clock, systemClock } from "./clock.js";
import type { Config } from "./config.js";
import type { Db, DbHandle, MongoClient } from "./db/client.js";
import { registerCategoriesModule } from "./modules/categories/categories.register.js";
import type { CategoriesRepository } from "./modules/categories/categories.repository.js";
import { registerUsersModule } from "./modules/users/users.register.js";
import type { UsersRepository } from "./modules/users/users.repository.js";
import type { UsersService } from "./modules/users/users.service.js";

export type AppCradle = {
  config: Config;
  logger: pino.Logger;
  db: Db;
  mongoClient: MongoClient;
  clock: Clock;
  auth: Auth;
  authAdapter: AuthAdapter;
  categoriesRepository: CategoriesRepository;
  usersRepository: UsersRepository;
  usersService: UsersService;
};

export type CreateContainerInput = {
  config: Config;
  logger: pino.Logger;
  dbHandle: DbHandle;
};

/**
 * Wires config, logger, db and every feature module (DESIGN 4.4, D-35).
 * New modules: add the folder, then one `registerXModule(container)` line below.
 */
export function createAppContainer(input: CreateContainerInput): AwilixContainer<AppCradle> {
  const container = createContainer<AppCradle>({
    injectionMode: InjectionMode.PROXY,
  });

  container.register({
    config: asValue(input.config),
    logger: asValue(input.logger),
    db: asValue(input.dbHandle.db),
    mongoClient: asValue(input.dbHandle.client),
    clock: asValue(systemClock),
    auth: asFunction(createAuth).singleton(),
    authAdapter: asFunction(createAuthAdapter).singleton(),
  });

  // One registration call per feature module.
  registerCategoriesModule(container);
  registerUsersModule(container);

  return container;
}
