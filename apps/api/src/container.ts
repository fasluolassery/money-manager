import { type AwilixContainer, asValue, createContainer, InjectionMode } from "awilix";
import type { Db, MongoClient } from "mongodb";
import type pino from "pino";
import type { Config } from "./config.js";
import type { DbHandle } from "./db/client.js";
import { registerUsersModule } from "./modules/users/users.register.js";
import type { UsersRepository } from "./modules/users/users.repository.js";
import type { UsersService } from "./modules/users/users.service.js";

export type AppCradle = {
  config: Config;
  logger: pino.Logger;
  db: Db;
  mongoClient: MongoClient;
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
  });

  // One registration call per feature module.
  registerUsersModule(container);

  return container;
}
