import { describe, expect, it, vi } from "vitest";
import type { MongoClient } from "./db/client.js";
import type { CategoriesRepository } from "./modules/categories/categories.repository.js";
import type { Profile } from "./modules/users/users.domain.js";
import type { UsersRepository } from "./modules/users/users.repository.js";
import { createUsersRoutes } from "./modules/users/users.routes.js";
import type { UsersService } from "./modules/users/users.service.js";
import { createTestContainer } from "./test-support/create-test-container.js";

const EXISTING_PROFILE = { id: "p1", userId: "user_1" } as Profile;

function fakeRepositories(findByUserId: UsersRepository["findByUserId"]) {
  return {
    usersRepository: {
      findByUserId,
      insertProfile: vi.fn(),
      updateProfile: vi.fn(),
    } satisfies UsersRepository,
    categoriesRepository: {
      insertDefaultCategories: vi.fn(),
    } satisfies CategoriesRepository,
    mongoClient: {} as MongoClient,
  };
}

describe("awilix container", () => {
  it("builds a container with fake repositories and calls a service through them", async () => {
    const findByUserId = vi.fn(async (userId: string) => {
      expect(userId).toBe("user_1");
      return EXISTING_PROFILE;
    });
    const fakes = fakeRepositories(findByUserId);

    const container = createTestContainer(fakes);
    const usersService = container.resolve<UsersService>("usersService");

    await expect(usersService.ensureProfile("user_1")).resolves.toBeUndefined();
    expect(findByUserId).toHaveBeenCalledWith("user_1");
    expect(fakes.usersRepository.insertProfile).not.toHaveBeenCalled();
  });

  it("lets routes resolve their service from the container", () => {
    const container = createTestContainer(fakeRepositories(vi.fn(async () => null)));
    const router = createUsersRoutes(container);
    expect(router).toBeDefined();
  });
});
