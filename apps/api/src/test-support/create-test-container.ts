import { type AwilixContainer, asFunction, asValue, createContainer, InjectionMode } from "awilix";
import type { Db } from "mongodb";
import pino from "pino";
import type { Config } from "../config.js";
import type { AppCradle } from "../container.js";
import { createUsersRepository, type UsersRepository } from "../modules/users/users.repository.js";
import { createUsersService } from "../modules/users/users.service.js";

const DEFAULT_CONFIG: Config = {
  NODE_ENV: "test",
  PORT: 3000,
  APP_URL: "http://localhost:3000",
  LOG_LEVEL: "silent",
  MONGODB_URI: "mongodb://localhost:27017",
  BETTER_AUTH_SECRET: "test-secret-32-chars-min-padding!",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  E2E_AUTH: false,
};

export type TestContainerOverrides = {
  config?: Config;
  logger?: pino.Logger;
  db?: Db;
  usersRepository?: UsersRepository;
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
  });

  if (overrides.db !== undefined) {
    container.register({ db: asValue(overrides.db) });
  }

  if (overrides.usersRepository !== undefined) {
    container.register({
      usersRepository: asValue(overrides.usersRepository),
    });
  } else {
    container.register({
      usersRepository: asFunction(createUsersRepository).singleton(),
    });
  }

  container.register({
    usersService: asFunction(createUsersService).singleton(),
  });

  return container;
}
