import { ObjectId } from "mongodb";

// Shared test-data primitives (DESIGN 10.8).
export function buildObjectId(overrides?: { hex?: string }): ObjectId {
  if (overrides?.hex !== undefined) return new ObjectId(overrides.hex);
  return new ObjectId();
}

export function buildUserId(overrides?: { value?: string }): string {
  return overrides?.value ?? `user_${buildObjectId().toHexString()}`;
}
