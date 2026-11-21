import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet: MongoMemoryReplSet | undefined;
let uriPromise: Promise<string> | undefined;

/** Starts a one-node replica set once per process (DESIGN 10.2, 4.6). */
export async function getMemoryMongoUri(): Promise<string> {
  if (uriPromise === undefined) {
    uriPromise = (async () => {
      replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
      });
      await replSet.waitUntilRunning();
      return replSet.getUri();
    })();
  }
  return uriPromise;
}

export async function stopMemoryMongo(): Promise<void> {
  if (replSet !== undefined) {
    await replSet.stop();
    replSet = undefined;
    uriPromise = undefined;
  }
}

/** Stops the in-memory server to simulate a database outage. */
export async function crashMemoryMongo(): Promise<void> {
  await stopMemoryMongo();
}
