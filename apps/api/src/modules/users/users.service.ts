import {
  DEFAULT_TIMEZONE,
  type MeResponse,
  type PatchMeBody,
  todayIn,
  VALIDATION_MESSAGES,
} from "@money-manager/shared";
import type { Clock } from "../../clock.js";
import type { MongoClient } from "../../db/client.js";
import { withTransaction } from "../../db/transaction.js";
import { ConflictError, NotFoundError, ValidationError } from "../../errors.js";
import type { CategoriesRepository } from "../categories/categories.repository.js";
import {
  buildNewProfile,
  buildProfileChanges,
  type Profile,
  toMeResponse,
  type UserIdentity,
} from "./users.domain.js";
import type { UsersRepository } from "./users.repository.js";

export type UsersService = ReturnType<typeof createUsersService>;

export type UsersServiceDeps = {
  usersRepository: UsersRepository;
  categoriesRepository: CategoriesRepository;
  mongoClient: MongoClient;
  clock: Clock;
};

/**
 * Users use cases (DESIGN 4.1–4.3, 7.2). Every function takes the signed-in `userId` first;
 * it comes from the session, never from the request (DESIGN 4.5).
 */
export function createUsersService({
  usersRepository,
  categoriesRepository,
  mongoClient,
  clock,
}: UsersServiceDeps) {
  async function loadProfile(userId: string): Promise<Profile> {
    const profile = await usersRepository.findByUserId(userId);
    if (profile === null) throw new NotFoundError();
    return profile;
  }

  async function createProfileWithCategories(userId: string): Promise<void> {
    const now = clock.now();
    const profile = buildNewProfile(userId, now, todayIn(DEFAULT_TIMEZONE, now));
    await withTransaction(mongoClient, async (session) => {
      await usersRepository.insertProfile(profile, session);
      await categoriesRepository.insertDefaultCategories(userId, now, session);
    });
  }

  return {
    /**
     * Creates the profile and default categories on first sign-in, in one transaction
     * (FR-13.1). Safe to call any number of times and at the same time: it does nothing
     * when the profile exists (DESIGN 7.2).
     */
    async ensureProfile(userId: string): Promise<void> {
      if ((await usersRepository.findByUserId(userId)) !== null) return;
      try {
        await createProfileWithCategories(userId);
      } catch (error) {
        // A parallel call created it first: the unique index refused ours, which is fine.
        const raced = error instanceof ConflictError;
        if (!raced || (await usersRepository.findByUserId(userId)) === null) throw error;
      }
    },

    async getMe(userId: string, identity: UserIdentity): Promise<MeResponse> {
      return toMeResponse(await loadProfile(userId), identity);
    },

    /**
     * Saves the timezone and, when sent, the opening balance and its date. The date can't be
     * after today in the new timezone (FR-9.3). The first save also sets `onboardedAt`, so the
     * welcome screen never returns (FR-13.3, FR-13.4). A stale `version` → 409 (DESIGN 4.7).
     */
    async patchMe(userId: string, identity: UserIdentity, body: PatchMeBody): Promise<MeResponse> {
      const now = clock.now();
      if (
        body.openingBalanceDate !== undefined &&
        body.openingBalanceDate > todayIn(body.timezone, now)
      ) {
        throw new ValidationError([
          { field: "openingBalanceDate", message: VALIDATION_MESSAGES.dateInFuture },
        ]);
      }
      const profile = await loadProfile(userId);
      const changes = buildProfileChanges(profile, body, now);
      const updated = await usersRepository.updateProfile(profile, body.version, changes);
      return toMeResponse(updated, identity);
    },
  };
}
