import type { UsersRepository } from "./users.repository.js";

export type UsersService = ReturnType<typeof createUsersService>;

export type UsersServiceDeps = {
  usersRepository: UsersRepository;
};

/**
 * Users use cases (DESIGN 4.1–4.3). No HTTP; endpoints arrive in #18.
 */
export function createUsersService({ usersRepository }: UsersServiceDeps) {
  return {
    async hasProfile(userId: string): Promise<boolean> {
      const count = await usersRepository.countByUserId(userId);
      return count > 0;
    },
  };
}
