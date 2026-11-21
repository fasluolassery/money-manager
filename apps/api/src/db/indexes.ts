import type { CreateIndexesOptions, Db, Document, IndexDescription } from "mongodb";

export type CollectionIndexSpec = {
  key: IndexDescription["key"];
  options?: CreateIndexesOptions;
};

export type CollectionRegistration = {
  name: string;
  indexes: CollectionIndexSpec[];
  /** MongoDB `$jsonSchema` validator document (DESIGN 5.6). */
  validator?: Document;
};

const registrations: CollectionRegistration[] = [];

/** Modules call this once at import time; `ensureIndexes` applies them at startup. */
export function registerCollection(registration: CollectionRegistration): void {
  registrations.push(registration);
}

/** Test helper: clear registrations between files when needed. */
export function clearCollectionRegistrations(): void {
  registrations.length = 0;
}

export function listCollectionRegistrations(): readonly CollectionRegistration[] {
  return registrations;
}

/**
 * Creates or updates indexes and `$jsonSchema` validators (DESIGN 5.1, 5.6).
 * Feature modules register their collections; none are registered until those issues.
 */
export async function ensureIndexes(db: Db): Promise<void> {
  for (const registration of registrations) {
    await applyCollection(db, registration);
  }
}

async function applyCollection(db: Db, registration: CollectionRegistration): Promise<void> {
  const existing = await db.listCollections({ name: registration.name }).toArray();
  if (existing.length === 0) {
    await db.createCollection(registration.name, collectionOptions(registration));
  } else if (registration.validator !== undefined) {
    await db.command({
      collMod: registration.name,
      validator: { $jsonSchema: registration.validator },
      validationLevel: "strict",
      validationAction: "error",
    });
  }

  if (registration.indexes.length === 0) return;
  const collection = db.collection(registration.name);
  const descriptions: IndexDescription[] = registration.indexes.map((index) => ({
    key: index.key,
    ...(index.options ?? {}),
  }));
  await collection.createIndexes(descriptions);
}

function collectionOptions(registration: CollectionRegistration): Document | undefined {
  if (registration.validator === undefined) return undefined;
  return {
    validator: { $jsonSchema: registration.validator },
    validationLevel: "strict",
    validationAction: "error",
  };
}
