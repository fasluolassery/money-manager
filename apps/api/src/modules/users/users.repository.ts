import type { Db } from "mongodb";

export type UsersRepository = ReturnType<typeof createUsersRepository>;

/**
 * Profiles collection access (DESIGN 5.3). Endpoints arrive in #18;
 * this skeleton proves the repository factory + ownership filter pattern.
 */
export function createUsersRepository({ db }: { db: Db }) {
  const profiles = db.collection("profiles");

  return {
    async countByUserId(userId: string): Promise<number> {
      return profiles.countDocuments({ userId });
    },
  };
}
