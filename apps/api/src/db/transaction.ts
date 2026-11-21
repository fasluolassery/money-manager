import type { ClientSession, MongoClient } from "mongodb";

// Runs multi-record writes as one commit; pass the session to each repository call (DESIGN 4.6).
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
