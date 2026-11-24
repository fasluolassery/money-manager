import { INITIAL_RECORD_VERSION } from "@money-manager/shared";
import type { Db } from "mongodb";
import { translateDriverError } from "../../db/errors.js";
import type { DbSession } from "../../db/transaction.js";
import { CATEGORIES_COLLECTION, type CategoryDocument } from "./categories.collection.js";
import { categoryNameLower, DEFAULT_CATEGORIES } from "./categories.domain.js";

export type CategoriesRepository = ReturnType<typeof createCategoriesRepository>;

/** Categories collection access (DESIGN 5.3). Every query filters by `userId` (DESIGN 4.5). */
export function createCategoriesRepository({ db }: { db: Db }) {
  const categories = db.collection<CategoryDocument>(CATEGORIES_COLLECTION);

  return {
    /**
     * Adds the default set and the built-in Lending category for a user (FR-5.4). Each one
     * is inserted only if the user has no category of that name yet, so a repeat call, or one
     * after the profile was lost, adds nothing and never overwrites an edited category.
     */
    async insertDefaultCategories(userId: string, now: Date, session?: DbSession): Promise<void> {
      const operations = DEFAULT_CATEGORIES.map((category) => {
        const nameLower = categoryNameLower(category.name);
        return {
          updateOne: {
            filter: { userId, nameLower },
            update: {
              $setOnInsert: {
                userId,
                name: category.name,
                nameLower,
                emoji: category.emoji,
                type: category.type,
                builtIn: category.builtIn,
                createdAt: now,
                updatedAt: now,
                version: INITIAL_RECORD_VERSION,
              },
            },
            upsert: true,
          },
        };
      });
      try {
        await categories.bulkWrite(operations, { session });
      } catch (error) {
        translateDriverError(error);
      }
    },
  };
}
