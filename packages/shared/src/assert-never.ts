/**
 * The `default` of a `switch` over a union: the compiler fails if a case is missing,
 * and an impossible value at run time fails fast instead of continuing (DESIGN 10.4, 15.6).
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
