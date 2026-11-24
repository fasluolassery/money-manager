import { type Collection, type Document, ObjectId, type UpdateFilter, type WithId } from "mongodb";
import { NotFoundError, StaleRecordError } from "../errors.js";
import type { DbSession } from "./transaction.js";

export type OwnedVersionFilter = {
  id: ObjectId | string;
  userId: string;
  version: number;
};

function toObjectId(id: ObjectId | string): ObjectId {
  return typeof id === "string" ? new ObjectId(id) : id;
}

/**
 * Update one owned document when `version` still matches; increments `version` (DESIGN 4.7).
 * Stale version → `StaleRecordError`; missing for this user → `NotFoundError`.
 */
export async function updateOwnedVersioned(
  collection: Collection,
  filter: OwnedVersionFilter,
  setFields: Document,
  options?: { session?: DbSession },
): Promise<WithId<Document>> {
  const _id = toObjectId(filter.id);
  const session = options?.session;
  const update: UpdateFilter<Document> = {
    $set: setFields,
    $inc: { version: 1 },
  };
  const updated = await collection.findOneAndUpdate(
    { _id, userId: filter.userId, version: filter.version },
    update,
    { returnDocument: "after", session },
  );
  if (updated !== null) return updated;

  const existing = await collection.findOne({ _id, userId: filter.userId }, { session });
  if (existing !== null) throw new StaleRecordError();
  throw new NotFoundError();
}

/**
 * Delete one owned document when `version` still matches (DESIGN 4.7).
 * Stale version → `StaleRecordError`; missing for this user → `NotFoundError`.
 */
export async function deleteOwnedVersioned(
  collection: Collection,
  filter: OwnedVersionFilter,
  options?: { session?: DbSession },
): Promise<void> {
  const _id = toObjectId(filter.id);
  const session = options?.session;
  const result = await collection.deleteOne(
    { _id, userId: filter.userId, version: filter.version },
    { session },
  );
  if (result.deletedCount === 1) return;

  const existing = await collection.findOne({ _id, userId: filter.userId }, { session });
  if (existing !== null) throw new StaleRecordError();
  throw new NotFoundError();
}
