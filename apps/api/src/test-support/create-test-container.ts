import { type AwilixContainer, asFunction, asValue, createContainer, InjectionMode } from "awilix";
import pino from "pino";
import { type Clock, systemClock } from "../clock.js";
import type { Config } from "../config.js";
import type { AppCradle } from "../container.js";
import type { Db, MongoClient } from "../db/client.js";
import {
  type CategoriesRepository,
  createCategoriesRepository,
} from "../modules/categories/categories.repository.js";
import { createUsersRepository, type UsersRepository } from "../modules/users/users.repository.js";
import { createUsersService } from "../modules/users/users.service.js";
import { TEST_CONFIG } from "./test-config.js";

const DEFAULT_CONFIG: Config = TEST_CONFIG;

export type TestContainerOverrides = {
  config?: Config;
  logger?: pino.Logger;
  db?: Db;
  mongoClient?: MongoClient;
  clock?: Clock;
  usersRepository?: UsersRepository;
  categoriesRepository?: CategoriesRepository;
};

/**
 * Builds an awilix container with optional fakes (DESIGN 4.4, 10.8).
 */
export function createTestContainer(
  overrides: TestContainerOverrides = {},
): AwilixContainer<AppCradle> {
  const container = createContainer<AppCradle>({
    injectionMode: InjectionMode.PROXY,
  });

  container.register({
    config: asValue(overrides.config ?? DEFAULT_CONFIG),
    logger: asValue(overrides.logger ?? pino({ level: "silent" })),
    clock: asValue(overrides.clock ?? systemClock),
  });
  if (overrides.db !== undefined) {
    container.register({ db: asValue(overrides.db) });
  }
  if (overrides.mongoClient !== undefined) {
    container.register({ mongoClient: asValue(overrides.mongoClient) });
  }
  container.register({
    usersRepository:
      overrides.usersRepository !== undefined
        ? asValue(overrides.usersRepository)
        : asFunction(createUsersRepository).singleton(),
    categoriesRepository:
      overrides.categoriesRepository !== undefined
        ? asValue(overrides.categoriesRepository)
        : asFunction(createCategoriesRepository).singleton(),
    usersService: asFunction(createUsersService).singleton(),
  });
  return container;
}
