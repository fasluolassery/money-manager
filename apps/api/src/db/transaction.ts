import type { ClientSession, MongoClient } from "mongodb";

/**
 * Runs multi-record writes as one commit (DESIGN 4.6, FR-11.1).
 * Repository functions accept an optional session so they join this block.
 */
export async function withTransaction<T>(
  client: MongoClient,
  work: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = client.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
