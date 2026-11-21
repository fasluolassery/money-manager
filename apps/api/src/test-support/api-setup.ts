import { afterAll } from "vitest";
import { stopMemoryMongo } from "./mongo-memory.js";

afterAll(async () => {
  await stopMemoryMongo();
});
