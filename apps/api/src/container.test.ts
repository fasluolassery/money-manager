import { describe, expect, it, vi } from "vitest";
import type { UsersRepository } from "./modules/users/users.repository.js";
import { createUsersRoutes } from "./modules/users/users.routes.js";
import type { UsersService } from "./modules/users/users.service.js";
import { createTestContainer } from "./test-support/create-test-container.js";

describe("awilix container", () => {
  it("builds a container with a fake repository and calls a service through it", async () => {
    const fakeRepository: UsersRepository = {
      countByUserId: vi.fn(async (userId: string) => {
        expect(userId).toBe("user_1");
        return 1;
      }),
    };

    const container = createTestContainer({ usersRepository: fakeRepository });
    const usersService = container.resolve<UsersService>("usersService");

    await expect(usersService.hasProfile("user_1")).resolves.toBe(true);
    expect(fakeRepository.countByUserId).toHaveBeenCalledWith("user_1");
  });

  it("lets routes resolve their service from the container", () => {
    const fakeRepository: UsersRepository = {
      countByUserId: vi.fn(async () => 0),
    };
    const container = createTestContainer({ usersRepository: fakeRepository });
    const router = createUsersRoutes(container);
    expect(router).toBeDefined();
  });
});
