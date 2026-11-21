import { ObjectId } from "mongodb";

/**
 * Test data builders (DESIGN 10.8). Feature builders (`buildTransaction`, …)
 * land with their feature issues; this file holds shared primitives.
 */
export function buildObjectId(overrides?: { hex?: string }): ObjectId {
  if (overrides?.hex !== undefined) return new ObjectId(overrides.hex);
  return new ObjectId();
}

export function buildUserId(overrides?: { value?: string }): string {
  return overrides?.value ?? `user_${buildObjectId().toHexString()}`;
}
