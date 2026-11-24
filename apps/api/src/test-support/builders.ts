import { ObjectId } from "mongodb";
import type { CategoryDocument } from "../modules/categories/categories.collection.js";
import type { ProfileDocument } from "../modules/users/users.collection.js";

// Shared test-data primitives and builders (DESIGN 10.8). Tests set only the fields they care about.

export function buildObjectId(overrides?: { hex?: string }): ObjectId {
  if (overrides?.hex !== undefined) return new ObjectId(overrides.hex);
  return new ObjectId();
}

export function buildUserId(overrides?: { value?: string }): string {
  return overrides?.value ?? `user_${buildObjectId().toHexString()}`;
}

const BUILT_AT = new Date("2026-11-24T10:00:00.000Z");

/** A valid `profiles` document. */
export function buildProfileDocument(overrides: Partial<ProfileDocument> = {}): ProfileDocument {
  return {
    userId: buildUserId(),
    timezone: "Asia/Kolkata",
    openingBalance: 0,
    openingBalanceDate: "2026-11-24",
    currency: "INR",
    lastBackupAt: null,
    onboardedAt: null,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    version: 1,
    ...overrides,
  };
}

/** A valid `categories` document. */
export function buildCategoryDocument(overrides: Partial<CategoryDocument> = {}): CategoryDocument {
  const name = overrides.name ?? "Groceries";
  return {
    userId: buildUserId(),
    name,
    nameLower: name.toLowerCase(),
    emoji: "🛒",
    type: "expense",
    builtIn: false,
    createdAt: BUILT_AT,
    updatedAt: BUILT_AT,
    version: 1,
    ...overrides,
  };
}
