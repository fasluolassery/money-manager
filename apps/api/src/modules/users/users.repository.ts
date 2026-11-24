import { type CalendarDate, type Paise, toId } from "@money-manager/shared";
import type { Db, WithId } from "mongodb";
import { translateDriverError } from "../../db/errors.js";
import type { DbSession } from "../../db/transaction.js";
import { updateOwnedVersioned } from "../../db/versioned-write.js";
import { PROFILES_COLLECTION, type ProfileDocument } from "./users.collection.js";
import type { NewProfile, Profile, ProfileChanges } from "./users.domain.js";

export type UsersRepository = ReturnType<typeof createUsersRepository>;

function toProfile(document: WithId<ProfileDocument>): Profile {
  return {
    id: toId(document._id),
    userId: document.userId,
    timezone: document.timezone,
    openingBalance: document.openingBalance as Paise,
    openingBalanceDate: document.openingBalanceDate as CalendarDate,
    currency: document.currency,
    lastBackupAt: document.lastBackupAt,
    onboardedAt: document.onboardedAt,
    version: document.version,
  };
}

/**
 * Profiles collection access (DESIGN 5.3). Every query filters by `userId` (DESIGN 4.5);
 * documents leave this file as plain `Profile` objects, never raw (DESIGN 6.6).
 */
export function createUsersRepository({ db }: { db: Db }) {
  const profiles = db.collection<ProfileDocument>(PROFILES_COLLECTION);

  return {
    async findByUserId(userId: string, session?: DbSession): Promise<Profile | null> {
      const document = await profiles.findOne({ userId }, { session });
      return document === null ? null : toProfile(document);
    },

    /** A second profile for the same user is a duplicate-key `ConflictError` (DESIGN 5.4). */
    async insertProfile(profile: NewProfile, session?: DbSession): Promise<void> {
      try {
        await profiles.insertOne({ ...profile }, { session });
      } catch (error) {
        translateDriverError(error);
      }
    },

    /** Applies `changes` when `version` still matches; stale → `StaleRecordError` (DESIGN 4.7). */
    async updateProfile(
      profile: Pick<Profile, "id" | "userId">,
      version: number,
      changes: ProfileChanges,
      session?: DbSession,
    ): Promise<Profile> {
      const updated = await updateOwnedVersioned(
        db.collection(PROFILES_COLLECTION),
        { id: profile.id, userId: profile.userId, version },
        changes,
        { session },
      );
      return toProfile(updated as WithId<ProfileDocument>);
    },
  };
}
