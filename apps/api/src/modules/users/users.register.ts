import { type AwilixContainer, asFunction } from "awilix";
import { createUsersRepository } from "./users.repository.js";
import { createUsersService } from "./users.service.js";

/** One call from `container.ts` registers this feature (DESIGN 4.4). */
export function registerUsersModule(container: AwilixContainer): void {
  container.register({
    usersRepository: asFunction(createUsersRepository).singleton(),
    usersService: asFunction(createUsersService).singleton(),
  });
}
