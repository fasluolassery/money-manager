import { DEFAULT_TIMEZONE, isTimezone } from "@money-manager/shared";

/** The same zone under an older name; browsers list this one instead of `Asia/Kolkata`. */
const OLD_NAMES = new Set(["Asia/Calcutta"]);

/** The timezone the device reports, or `Asia/Kolkata` when it reports none we recognise. */
export function detectTimezone(): string {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isTimezone(detected) ? detected : DEFAULT_TIMEZONE;
}

/** Every timezone the browser knows, A to Z, always including `chosen` and `Asia/Kolkata`. */
export function listTimezones(chosen: string): string[] {
  const known = Intl.supportedValuesOf("timeZone").filter((zone) => !OLD_NAMES.has(zone));
  return [...new Set([...known, DEFAULT_TIMEZONE, chosen])].sort();
}
